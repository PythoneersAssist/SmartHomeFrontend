import type { Device, Room } from '../../types/domain';
import { DEVICE_TYPE_LABELS } from '../../types/domain';
import { getDeviceTypeIcon } from './deviceIcons';
import styles from './dashboard.module.css';

type Props = {
  favoriteDevices: Device[];
  roomMap: Map<string, Room>;
  onToggleDevice: (device: Device) => void;
  onToggleFavorite: (deviceId: string) => void;
  submitting: boolean;
};

export function FavouritesTab({ favoriteDevices, roomMap, onToggleDevice, onToggleFavorite, submitting }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className={`${styles.sectionTitle} text-slate-300`}>Favourites</p>
        <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
          {favoriteDevices.length} saved
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {favoriteDevices.map((device) => {
          const isOn = Boolean(device.parameters?.status);
          return (
            <div className={`${styles.deviceCard} ${isOn ? styles.deviceCardOn : ''} p-4`} key={device.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-white">{device.name}</p>
                  <p className="text-xs text-slate-400">{DEVICE_TYPE_LABELS[device.type] ?? 'Unknown'} &middot; {roomMap.get(device.room_id)?.name ?? '—'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="Remove from favourites"
                    className="rounded-lg border border-amber-300/45 bg-amber-400/15 px-2 py-1 text-amber-200 transition hover:bg-amber-400/25"
                    onClick={() => onToggleFavorite(device.id)}
                    type="button"
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.012 3.114a1 1 0 00.95.69h3.276c.969 0 1.371 1.24.588 1.81l-2.65 1.925a1 1 0 00-.364 1.118l1.012 3.114c.3.922-.755 1.688-1.538 1.118l-2.65-1.925a1 1 0 00-1.175 0l-2.65 1.925c-.783.57-1.838-.196-1.539-1.118l1.013-3.114a1 1 0 00-.364-1.118L4.223 8.54c-.783-.57-.38-1.81.588-1.81h3.276a1 1 0 00.95-.69l1.012-3.114z" />
                    </svg>
                  </button>
                  {getDeviceTypeIcon(device.type)}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isOn ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className={`text-xs font-semibold ${isOn ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isOn ? 'ON' : 'OFF'}
                  </span>
                </div>
                <button
                  className="focus:outline-none"
                  disabled={submitting}
                  onClick={() => onToggleDevice(device)}
                  type="button"
                >
                  <div className={`${styles.toggleTrack} ${isOn ? styles.toggleTrackOn : styles.toggleTrackOff}`}>
                    <div className={`${styles.toggleKnob} ${isOn ? styles.toggleKnobOn : styles.toggleKnobOff}`} />
                  </div>
                </button>
              </div>
            </div>
          );
        })}

        {favoriteDevices.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
            No favourite devices yet. Open Devices or Overview and press the star icon on a device.
          </p>
        )}
      </div>
    </section>
  );
}
