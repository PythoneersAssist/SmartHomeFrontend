import type { FormEvent } from 'react';
import type { Device } from '../../types/domain';
import { DEVICE_TYPE_LABELS } from '../../types/domain';
import { DeviceParamEditor } from './DeviceParamEditor';
import styles from './dashboard.module.css';

type Props = {
  device: Device;
  onChange: (device: Device) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function EditDeviceModal({ device, onChange, onSubmit, onClose }: Props) {
  const params = device.parameters as Record<string, unknown> ?? {};
  const hasStatus = 'status' in params;

  return (
    <section className={`${styles.modal} fixed inset-0 z-20 grid place-items-center px-4`}>
      <form className={`${styles.modalCard} w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto`} onSubmit={onSubmit}>
        <h3 className="text-xl font-extrabold text-white">Update Device</h3>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
            Name
            <input
              className={styles.formInput}
              onChange={(e) => onChange({ ...device, name: e.target.value })}
              value={device.name}
            />
          </label>
          <p className="text-xs text-slate-400">Type: {DEVICE_TYPE_LABELS[device.type] ?? 'Unknown'}</p>

          {/* Status toggle */}
          {hasStatus && (
            <div className="flex items-center justify-between rounded-xl border border-cyan-200/10 bg-slate-800/40 px-4 py-3">
              <span className="text-sm font-semibold text-cyan-100">Power</span>
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
          <button className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-900" type="submit">
            Save
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
