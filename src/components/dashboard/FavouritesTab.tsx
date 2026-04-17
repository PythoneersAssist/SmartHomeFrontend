import type { Device, Room } from '../../types/domain';
import { DeviceControlCard } from './DeviceControlCard';
import styles from './dashboard.module.css';

type Props = {
  favoriteDevices: Device[];
  roomMap: Map<string, Room>;
  onToggleDevice: (device: Device) => void;
  onSaveDeviceSettings: (device: Device, parameters: Record<string, unknown>) => Promise<void>;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (deviceId: string, deviceName: string) => void;
  onToggleFavorite: (deviceId: string) => void;
  submitting: boolean;
};

export function FavouritesTab({
  favoriteDevices,
  roomMap,
  onToggleDevice,
  onSaveDeviceSettings,
  onEditDevice,
  onDeleteDevice,
  onToggleFavorite,
  submitting,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className={`${styles.sectionTitle} text-slate-300`}>Favourites</p>
        <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
          {favoriteDevices.length} saved
        </span>
      </div>

      <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {favoriteDevices.map((device) => (
          <DeviceControlCard
            device={device}
            isFavorite
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

        {favoriteDevices.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
            No favourite devices yet. Open Devices or Overview and use the Favorite action on a device.
          </p>
        )}
      </div>
    </section>
  );
}
