import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NotificationBell } from '../components/NotificationBell';
import { AutomationsTab } from '../components/dashboard/AutomationsTab';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DevicesTab } from '../components/dashboard/DevicesTab';
import { EditDeviceModal } from '../components/dashboard/EditDeviceModal';
import { EditRoomModal } from '../components/dashboard/EditRoomModal';
import { EnergyTab } from '../components/dashboard/EnergyTab';
import { MobileDrawer } from '../components/dashboard/MobileDrawer';
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { RoomsTab } from '../components/dashboard/RoomsTab';
import { initialDeviceForm, initialRoomForm } from '../components/dashboard/types';
import type { DashboardTab, DeviceFormState, RoomFormState } from '../components/dashboard/types';
import { useAuth } from '../contexts/AuthContext';
import { useHouseStore } from '../contexts/HouseContext';
import { useToast } from '../contexts/ToastContext';
import { backendApi } from '../services/api';
import type { Device, Room } from '../types/domain';
import { DEVICE_TYPE_LABELS } from '../types/domain';

export function HouseDetailPage() {
  const { houseId } = useParams();
  const { user, logout } = useAuth();
  const { houses } = useHouseStore();
  const { addToast } = useToast();

  const house = useMemo(() => houses.find((item) => item.id === houseId) ?? null, [houseId, houses]);

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roomForm, setRoomForm] = useState<RoomFormState>(initialRoomForm);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [deviceForm, setDeviceForm] = useState<DeviceFormState>(initialDeviceForm);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const [pendingDelete, setPendingDelete] = useState<{ kind: 'room'; room: Room } | { kind: 'device'; deviceId: string; deviceName: string } | null>(null);

  // Room drill-down state
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Device search/filter state
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<number | -2>(-2); // -2 = all

  // Filter devices to only those belonging to this house's rooms
  const roomIds = useMemo(() => new Set(rooms.map((r) => r.id)), [rooms]);
  const houseDevices = useMemo(() => devices.filter((d) => roomIds.has(d.room_id)), [devices, roomIds]);
  const houseRooms = rooms;

  // Build a room lookup map for device display
  const roomMap = useMemo(() => {
    const map = new Map<string, Room>();
    for (const room of rooms) {
      map.set(room.id, room);
    }
    return map;
  }, [rooms]);

  // Filtered devices for the devices tab
  const filteredDevices = useMemo(() => {
    let result = houseDevices;
    if (deviceSearch.trim()) {
      const q = deviceSearch.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (DEVICE_TYPE_LABELS[d.type] ?? '').toLowerCase().includes(q) ||
          (roomMap.get(d.room_id)?.name ?? '').toLowerCase().includes(q),
      );
    }
    if (deviceTypeFilter !== -2) {
      result = result.filter((d) => d.type === deviceTypeFilter);
    }
    return result;
  }, [houseDevices, deviceSearch, deviceTypeFilter, roomMap]);

  async function loadData() {
    if (!houseId) return;
    setLoading(true);
    setError(null);

    try {
      const [roomsData, devicesData] = await Promise.all([
        backendApi.getRooms(houseId),
        backendApi.getDevices(),
      ]);
      setRooms(roomsData);
      setDevices(devicesData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load house data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houseId]);

  useEffect(() => {
    setDeviceForm((prev) => {
      if (houseRooms.length === 0) {
        return { ...prev, room_id: '' };
      }

      if (houseRooms.some((room) => room.id === prev.room_id)) {
        return prev;
      }

      return { ...prev, room_id: houseRooms[0].id };
    });
  }, [houseRooms]);

  if (!houseId || !house) {
    return <Navigate to="/houses" replace />;
  }

  async function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!houseId) return;

    setSubmitting(true);
    setError(null);

    try {
      await backendApi.createRoom({ ...roomForm, house_id: houseId });
      setRoomForm(initialRoomForm);
      await loadData();
      addToast('Room created successfully');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRoom) return;

    setSubmitting(true);
    setError(null);

    try {
      await backendApi.updateRoom({
        room_id: editingRoom.id,
        name: editingRoom.name,
        floor: editingRoom.floor,
      });
      setEditingRoom(null);
      await loadData();
      addToast('Room updated successfully');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to update room');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRoom(room: Room) {
    setSubmitting(true);
    setError(null);

    try {
      await backendApi.deleteRoom(room.id);
      await loadData();
      addToast('Room deleted');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete room');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!houseId) return;

    setSubmitting(true);
    setError(null);

    try {
      await backendApi.createDevice({
        name: deviceForm.name,
        device_type: deviceForm.device_type,
        room_id: deviceForm.room_id,
      });
      setDeviceForm((prev) => ({ ...initialDeviceForm, room_id: prev.room_id }));
      await loadData();
      addToast('Device created successfully');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create device');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingDevice) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await backendApi.updateDevice({
        device_id: editingDevice.id,
        name: editingDevice.name,
        parameters: editingDevice.parameters as Record<string, unknown>,
      });
      setEditingDevice(null);
      await loadData();
      addToast('Device updated successfully');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to update device');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDevice(deviceId: string) {
    setSubmitting(true);
    setError(null);

    try {
      await backendApi.deleteDevice(deviceId);
      await loadData();
      addToast('Device deleted');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete device');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleDevice(device: Device) {
    const currentStatus = Boolean(device.parameters?.status);
    setSubmitting(true);
    setError(null);

    try {
      await backendApi.updateDevice({
        device_id: device.id,
        parameters: { ...device.parameters as Record<string, unknown>, status: !currentStatus },
      });
      await loadData();
      addToast(`${device.name} turned ${!currentStatus ? 'on' : 'off'}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to toggle device status');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#060d19]">
      {/* ── Sidebar ── */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        houseName={house.name}
        username={user?.username}
        onLogout={logout}
      />

      {/* ── Main Area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-cyan-500/10 bg-[#0a1628]/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              type="button"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="hidden text-base font-bold text-white md:block">
              SMART HOME DASHBOARD <span className="text-cyan-400">| {house.name.toUpperCase()}</span>
            </h1>
            <h1 className="text-sm font-bold text-white md:hidden truncate max-w-[180px]">
              {house.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right text-sm md:block">
              <p className="text-slate-300">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[11px] text-slate-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <NotificationBell />
            <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 transition hover:bg-cyan-500/25">
              <span className="text-sm font-bold text-cyan-300">{user?.username?.[0]?.toUpperCase() ?? '?'}</span>
            </Link>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {error ? (
            <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{error}</p>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            </div>
          ) : (
            <div key={activeTab} className="animate-[fadeInUp_0.3s_ease-out]">
              {activeTab === 'overview' && (
                <OverviewTab
                  rooms={houseRooms}
                  devices={houseDevices}
                  roomMap={roomMap}
                  expandedRoomId={expandedRoomId}
                  onExpandRoom={setExpandedRoomId}
                  onToggleDevice={(d) => void handleToggleDevice(d)}
                  submitting={submitting}
                />
              )}

              {activeTab === 'rooms' && (
                <RoomsTab
                  rooms={houseRooms}
                  devices={houseDevices}
                  roomForm={roomForm}
                  onRoomFormChange={setRoomForm}
                  onCreateRoom={handleCreateRoom}
                  onEditRoom={setEditingRoom}
                  onDeleteRoom={(room) => setPendingDelete({ kind: 'room', room })}
                  submitting={submitting}
                />
              )}

              {activeTab === 'devices' && (
                <DevicesTab
                  devices={houseDevices}
                  filteredDevices={filteredDevices}
                  rooms={houseRooms}
                  roomMap={roomMap}
                  deviceForm={deviceForm}
                  onDeviceFormChange={setDeviceForm}
                  onCreateDevice={handleCreateDevice}
                  onEditDevice={setEditingDevice}
                  onDeleteDevice={(id, name) => setPendingDelete({ kind: 'device', deviceId: id, deviceName: name })}
                  onToggleDevice={(d) => void handleToggleDevice(d)}
                  deviceSearch={deviceSearch}
                  onSearchChange={setDeviceSearch}
                  deviceTypeFilter={deviceTypeFilter}
                  onTypeFilterChange={setDeviceTypeFilter}
                  submitting={submitting}
                />
              )}

              {activeTab === 'energy' && houseId && (
                <EnergyTab houseId={houseId} />
              )}

              {activeTab === 'automations' && (
                <AutomationsTab houseDevices={houseDevices} />
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile Drawer ── */}
      <MobileDrawer
        open={mobileMenuOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        houseName={house.name}
        onClose={() => setMobileMenuOpen(false)}
        onLogout={logout}
      />

      {/* ── Modals ── */}
      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          onChange={setEditingRoom}
          onSubmit={handleUpdateRoom}
          onClose={() => setEditingRoom(null)}
        />
      )}

      {editingDevice && (
        <EditDeviceModal
          device={editingDevice}
          onChange={setEditingDevice}
          onSubmit={handleUpdateDevice}
          onClose={() => setEditingDevice(null)}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'room' ? 'Delete Room' : 'Delete Device'}
        message={
          pendingDelete?.kind === 'room'
            ? `Are you sure you want to delete "${pendingDelete.room.name}"? All devices in this room will be removed.`
            : `Are you sure you want to delete "${pendingDelete?.kind === 'device' ? pendingDelete.deviceName : ''}"?`
        }
        onConfirm={() => {
          if (pendingDelete?.kind === 'room') {
            void handleDeleteRoom(pendingDelete.room);
          } else if (pendingDelete?.kind === 'device') {
            void handleDeleteDevice(pendingDelete.deviceId);
          }
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
