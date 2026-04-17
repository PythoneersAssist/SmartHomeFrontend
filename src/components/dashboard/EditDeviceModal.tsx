import type { FormEvent } from 'react';
import type { Device, Room } from '../../types/domain';
import { DEVICE_TYPE_LABELS } from '../../types/domain';
import { DeviceParamEditor } from './DeviceParamEditor';
import styles from './dashboard.module.css';

type Props = {
  device: Device;
  rooms: Room[];
  onChange: (device: Device) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  submitting: boolean;
};

export function EditDeviceModal({ device, rooms, onChange, onSubmit, onClose, submitting }: Props) {
  const params = device.parameters as Record<string, unknown> ?? {};
  const hasStatus = 'status' in params;

  return (
    <section className={`${styles.modal} fixed inset-0 z-20 grid place-items-center px-4`}>
      <form className={`${styles.modalCard} w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto`} onSubmit={onSubmit}>
        <h3 className="text-xl font-extrabold text-white">Edit Device</h3>
        <p className="mt-1 text-sm text-slate-400">
          {device.name} &middot; {DEVICE_TYPE_LABELS[device.type] ?? 'Unknown'}
        </p>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
            Device Name
            <input
              className={styles.formInput}
              onChange={(e) => onChange({ ...device, name: e.target.value })}
              required
              value={device.name}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
            Room
            <select
              className={styles.formInput}
              onChange={(e) => onChange({ ...device, room_id: e.target.value })}
              value={device.room_id}
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </label>

          {/* Status toggle */}
          {hasStatus && (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/40 px-4 py-3">
              <span className="text-sm font-semibold text-slate-200">Power</span>
              <button
                className="focus:outline-none"
                onClick={() => onChange({ ...device, parameters: { ...params, status: !params.status } })}
                type="button"
              >
                <div className={`${styles.toggleTrack} ${params.status ? styles.toggleTrackOn : styles.toggleTrackOff}`}>
                  <div className={`${styles.toggleKnob} ${params.status ? styles.toggleKnobOn : styles.toggleKnobOff}`} />
                </div>
              </button>
            </div>
          )}

          {/* Type-aware parameter controls */}
          <DeviceParamEditor
            deviceType={device.type}
            parameters={params}
            onChange={(key, val) => onChange({ ...device, parameters: { ...params, [key]: val } })}
          />
        </div>
        <div className="mt-5 flex gap-2">
          <button className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-60" disabled={submitting} type="submit">
            {submitting ? 'Saving...' : 'Save Device'}
          </button>
          <button
            className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
