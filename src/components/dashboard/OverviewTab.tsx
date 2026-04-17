import type { Device, Room } from '../../types/domain';
import { DeviceControlCard } from './DeviceControlCard';
import { getRoomTypeIcon } from './roomIcons';
import styles from './dashboard.module.css';

type Props = {
  rooms: Room[];
  devices: Device[];
  roomMap: Map<string, Room>;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
  onToggleDevice: (device: Device) => void;
  onSaveDeviceSettings: (device: Device, parameters: Record<string, unknown>) => Promise<void>;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (deviceId: string, deviceName: string) => void;
  favoriteDeviceIds: Set<string>;
  onToggleFavorite: (deviceId: string) => void;
  submitting: boolean;
};

export function OverviewTab({
  rooms,
  devices,
  roomMap,
  selectedRoomId,
  onSelectRoom,
  onToggleDevice,
  onSaveDeviceSettings,
  onEditDevice,
  onDeleteDevice,
  favoriteDeviceIds,
  onToggleFavorite,
  submitting,
}: Props) {
  const activeDeviceCount = devices.filter((d) => Boolean(d.parameters?.status)).length;
  const favoriteDeviceCount = devices.filter((d) => favoriteDeviceIds.has(d.id)).length;
  const selectedRoomName = selectedRoomId ? (roomMap.get(selectedRoomId)?.name ?? 'Selected Room') : 'Favourites';
  const visibleDevices = selectedRoomId
    ? devices.filter((device) => device.room_id === selectedRoomId)
    : devices.filter((device) => favoriteDeviceIds.has(device.id));

  return (
    <>
      {/* Stats row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className={`${styles.statCard} relative p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Devices</p>
              <p className="text-2xl font-black text-white">{activeDeviceCount} <span className="text-sm font-semibold text-slate-400">/ {devices.length}</span></p>
            </div>
          </div>
        </article>

        <article className={`${styles.statCard} relative p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
              <svg className="h-5 w-5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rooms</p>
              <p className="text-2xl font-black text-white">{rooms.length}</p>
            </div>
          </div>
        </article>

        <article className={`${styles.statCard} relative p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15">
              <svg className="h-5 w-5 text-amber-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.012 3.114a1 1 0 00.95.69h3.276c.969 0 1.371 1.24.588 1.81l-2.65 1.925a1 1 0 00-.364 1.118l1.012 3.114c.3.922-.755 1.688-1.538 1.118l-2.65-1.925a1 1 0 00-1.175 0l-2.65 1.925c-.783.57-1.838-.196-1.539-1.118l1.013-3.114a1 1 0 00-.364-1.118L4.223 8.54c-.783-.57-.38-1.81.588-1.81h3.276a1 1 0 00.95-.69l1.012-3.114z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Favourites</p>
              <p className="text-2xl font-black text-white">{favoriteDeviceCount}</p>
            </div>
          </div>
        </article>
      </section>

      {/* Room Tabs */}
      <section className="mt-6">
        <p className={styles.sectionTitle}>Rooms</p>
        <div className={`${styles.roomTabsRail} mt-3`}>
          <button
            className={`${styles.roomTab} ${selectedRoomId === null ? styles.roomTabActive : ''}`}
            onClick={() => onSelectRoom(null)}
            type="button"
          >
            Favourites
          </button>
          {rooms.map((room) => (
            <button
              className={`${styles.roomTab} ${selectedRoomId === room.id ? styles.roomTabActive : ''}`}
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              type="button"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-300">{getRoomTypeIcon(room.room_type)}</span>
                <span>{room.name}</span>
              </span>
            </button>
          ))}
        </div>
        {rooms.length === 0 && (
          <p className="mt-3 rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-500">
            No rooms yet. Go to the Rooms tab to add one.
          </p>
        )}
      </section>

      {/* Room Devices */}
      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <p className={styles.sectionTitle}>{selectedRoomName} Devices</p>
          <p className="text-xs font-semibold text-slate-500">{visibleDevices.length} shown</p>
        </div>
      </section>

      <section className="mt-3">
        <div className="mt-3 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleDevices.map((device) => (
            <DeviceControlCard
              device={device}
              isFavorite={favoriteDeviceIds.has(device.id)}
              key={device.id}
              onDeleteDevice={onDeleteDevice}
              onEditDevice={onEditDevice}
              onSaveDeviceSettings={onSaveDeviceSettings}
              onToggleDevice={onToggleDevice}
              onToggleFavorite={onToggleFavorite}
              roomName={roomMap.get(device.room_id)?.name ?? '—'}
              submitting={submitting}
            />
          ))}
          {devices.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-500">
              No devices yet. Go to the Devices tab to add one.
            </p>
          )}
          {devices.length > 0 && visibleDevices.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-500">
              {selectedRoomId ? 'No devices in this room yet.' : 'No favourite devices yet. Tap the star icon on a device.'}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
