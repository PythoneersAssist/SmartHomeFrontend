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
import { FavouritesTab } from '../components/dashboard/FavouritesTab';
import { MobileDrawer } from '../components/dashboard/MobileDrawer';
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { RoomsTab } from '../components/dashboard/RoomsTab';
import { initialDeviceForm, initialRoomForm } from '../components/dashboard/types';
import type { DashboardTab, DeviceFormState, RoomFormState } from '../components/dashboard/types';
import { useAuth } from '../contexts/AuthContext';
import { useHouseStore } from '../contexts/HouseContext';
import { useToast } from '../contexts/ToastContext';
import { backendApi } from '../services/api';
import { localData } from '../services/storage';
import type { Device, Room } from '../types/domain';
import { DEFAULT_ROOM_TYPE, DEVICE_TYPE_LABELS } from '../types/domain';

export function HouseDetailPage() {
  const { houseId } = useParams();
  const { user, logout } = useAuth();
  const { houses, housesLoading } = useHouseStore();
  const { addToast } = useToast();

  const house = useMemo(() => houses.find((item) => item.id === houseId) ?? null, [houseId, houses]);

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const [roomForm, setRoomForm] = useState<RoomFormState>(initialRoomForm);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [deviceForm, setDeviceForm] = useState<DeviceFormState>(initialDeviceForm);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const [pendingDelete, setPendingDelete] = useState<{ kind: 'room'; room: Room } | { kind: 'device'; deviceId: string; deviceName: string } | null>(null);

  // Selected room for overview filtering
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Device search/filter state
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<number | -2>(-2); // -2 = all
  const [favoriteDeviceIds, setFavoriteDeviceIds] = useState<string[]>([]);

  // Filter devices to only those belonging to this house's rooms
  const roomIds = useMemo(() => new Set(rooms.map((r) => r.id)), [rooms]);
  const houseDevices = useMemo(() => devices.filter((d) => roomIds.has(d.room_id)), [devices, roomIds]);
  const houseRooms = rooms;
  const favoriteDeviceIdSet = useMemo(() => new Set(favoriteDeviceIds), [favoriteDeviceIds]);
  const favoriteDevices = useMemo(
    () => houseDevices.filter((device) => favoriteDeviceIdSet.has(device.id)),
    [houseDevices, favoriteDeviceIdSet],
  );

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
    if (!houseId) {
      setFavoriteDeviceIds([]);
      return;
    }

    setFavoriteDeviceIds(localData.getFavoriteDeviceIds(houseId));
  }, [houseId]);

  useEffect(() => {
    if (!houseId) {
      return;
    }
    localData.saveFavoriteDeviceIds(houseId, favoriteDeviceIds);
  }, [houseId, favoriteDeviceIds]);

  useEffect(() => {
    const validIds = new Set(houseDevices.map((device) => device.id));
    setFavoriteDeviceIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [houseDevices]);

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

  useEffect(() => {
    if (!selectedRoomId) {
      return;
    }

    if (!houseRooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(null);
    }
  }, [houseRooms, selectedRoomId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  if (!houseId) {
    return <Navigate to="/houses" replace />;
  }

  if (housesLoading) {
    return (
      <div className="appShellBackground flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!house) {
    return <Navigate to="/houses" replace />;
  }

  async function handleCreateRoom(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();
    if (!houseId) return false;

    setSubmitting(true);
    setError(null);

    try {
      await backendApi.createRoom({ ...roomForm, floor: 'Entrance', house_id: houseId });
      setRoomForm(initialRoomForm);
      await loadData();
      addToast('Room created successfully');
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create room');
      return false;
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
        room_type: editingRoom.room_type ?? DEFAULT_ROOM_TYPE,
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

  async function handleCreateDevice(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();
    if (!houseId) return false;

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
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create device');
      return false;
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
        room_id: editingDevice.room_id,
        parameters: editingDevice.parameters as Record<string, unknown>,
      });
      setEditingDevice(null);
      await loadData();
      addToast('Device settings updated successfully');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to update device');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDeviceSettings(device: Device, parameters: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);

    try {
      await backendApi.updateDevice({
        device_id: device.id,
        parameters,
      });
      await loadData();
      addToast(`${device.name} controls updated`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to save device controls');
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

  function handleToggleFavorite(deviceId: string) {
    const isFavorite = favoriteDeviceIdSet.has(deviceId);
    setFavoriteDeviceIds((prev) => {
      const alreadyFavorite = prev.includes(deviceId);
      return alreadyFavorite ? prev.filter((id) => id !== deviceId) : [...prev, deviceId];
    });
    addToast(isFavorite ? 'Removed from favourites' : 'Added to favourites');
  }

  return (
    <div className="appShellBackground flex h-screen overflow-hidden">
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
        <header className="flex items-center justify-between border-b border-white/10 bg-[#0b0f14]/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/12 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              type="button"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="hidden text-base font-bold text-white md:block">
              SMART HOME DASHBOARD <span className="text-emerald-300">| {house.name.toUpperCase()}</span>
            </h1>
            <h1 className="text-sm font-bold text-white md:hidden truncate max-w-[180px]">
              {house.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right text-sm md:block">
              <p className="text-slate-300">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[11px] text-slate-500">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <NotificationBell />
            <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 transition hover:bg-emerald-500/25">
              <span className="text-sm font-bold text-emerald-300">{user?.username?.[0]?.toUpperCase() ?? '?'}</span>
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
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            </div>
          ) : (
            <div key={activeTab} className="animate-[fadeInUp_0.3s_ease-out]">
              {activeTab === 'overview' && (
                <OverviewTab
                  rooms={houseRooms}
                  devices={houseDevices}
                  roomMap={roomMap}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                  onToggleDevice={(d) => void handleToggleDevice(d)}
                  onSaveDeviceSettings={handleSaveDeviceSettings}
                  onEditDevice={setEditingDevice}
                  onDeleteDevice={(id, name) => setPendingDelete({ kind: 'device', deviceId: id, deviceName: name })}
                  favoriteDeviceIds={favoriteDeviceIdSet}
                  onToggleFavorite={handleToggleFavorite}
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
                  onEditRoom={(room) => setEditingRoom({ ...room, room_type: room.room_type ?? DEFAULT_ROOM_TYPE })}
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
                  onSaveDeviceSettings={handleSaveDeviceSettings}
                  onDeleteDevice={(id, name) => setPendingDelete({ kind: 'device', deviceId: id, deviceName: name })}
                  onToggleDevice={(d) => void handleToggleDevice(d)}
                  deviceSearch={deviceSearch}
                  onSearchChange={setDeviceSearch}
                  deviceTypeFilter={deviceTypeFilter}
                  onTypeFilterChange={setDeviceTypeFilter}
                  favoriteDeviceIds={favoriteDeviceIdSet}
                  onToggleFavorite={handleToggleFavorite}
                  submitting={submitting}
                />
              )}

              {activeTab === 'favourites' && (
                <FavouritesTab
                  favoriteDevices={favoriteDevices}
                  roomMap={roomMap}
                  onToggleDevice={(d) => void handleToggleDevice(d)}
                  onSaveDeviceSettings={handleSaveDeviceSettings}
                  onEditDevice={setEditingDevice}
                  onDeleteDevice={(id, name) => setPendingDelete({ kind: 'device', deviceId: id, deviceName: name })}
                  onToggleFavorite={handleToggleFavorite}
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
          rooms={houseRooms}
          onChange={setEditingDevice}
          onSubmit={handleUpdateDevice}
          onClose={() => setEditingDevice(null)}
          submitting={submitting}
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
