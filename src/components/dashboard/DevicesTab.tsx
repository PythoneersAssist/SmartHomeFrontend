import type { FormEvent } from 'react';
import type { Device, Room } from '../../types/domain';
import { DEVICE_TYPE_LABELS, DEVICE_TYPE_OPTIONS } from '../../types/domain';
import { getDeviceTypeIcon } from './deviceIcons';
import type { DeviceFormState } from './types';
import styles from './dashboard.module.css';

type Props = {
  devices: Device[];
  filteredDevices: Device[];
  rooms: Room[];
  roomMap: Map<string, Room>;
  deviceForm: DeviceFormState;
  onDeviceFormChange: (form: DeviceFormState) => void;
  onCreateDevice: (e: FormEvent<HTMLFormElement>) => void;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (deviceId: string, deviceName: string) => void;
  onToggleDevice: (device: Device) => void;
  deviceSearch: string;
  onSearchChange: (search: string) => void;
  deviceTypeFilter: number;
  onTypeFilterChange: (filter: number) => void;
  submitting: boolean;
};

export function DevicesTab({
  devices, filteredDevices, rooms, roomMap, deviceForm, onDeviceFormChange,
  onCreateDevice, onEditDevice, onDeleteDevice, onToggleDevice,
  deviceSearch, onSearchChange, deviceTypeFilter, onTypeFilterChange, submitting,
}: Props) {
  return (
    <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
      {/* Add Device Form */}
      <form className="rounded-2xl border border-cyan-200/10 bg-slate-900/50 p-5" onSubmit={onCreateDevice}>
        <h2 className="text-lg font-extrabold text-white">Add Device</h2>
        <p className="mb-4 mt-1 text-sm text-slate-400">Devices are assigned to one of this house's rooms.</p>

        <div className="grid gap-3">
          <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
            Device Name
            <input
              className={styles.formInput}
              onChange={(e) => onDeviceFormChange({ ...deviceForm, name: e.target.value })}
              placeholder="e.g. Main Light"
              required
              value={deviceForm.name}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
              Type
              <select
                className={styles.formInput}
                onChange={(e) => onDeviceFormChange({ ...deviceForm, device_type: Number(e.target.value) })}
                required
                value={deviceForm.device_type}
              >
                {DEVICE_TYPE_OPTIONS.map((dt) => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
              Room
              <select
                className={styles.formInput}
                onChange={(e) => onDeviceFormChange({ ...deviceForm, room_id: e.target.value })}
                required
                value={deviceForm.room_id}
              >
                {rooms.length === 0 ? <option value="">No rooms</option> : null}
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="mt-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 font-bold text-slate-900 transition hover:-translate-y-0.5"
            disabled={submitting || rooms.length === 0}
            type="submit"
          >
            {submitting ? 'Adding...' : 'Add Device'}
          </button>
        </div>
      </form>

      {/* Device List with search/filter */}
      <div>
        {/* Search & Filter Bar */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className={`${styles.formInput} pl-9`}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search devices, types, rooms…"
              type="text"
              value={deviceSearch}
            />
          </div>
          <select
            className={`${styles.formInput} w-auto min-w-[140px]`}
            onChange={(e) => onTypeFilterChange(Number(e.target.value))}
            value={deviceTypeFilter}
          >
            <option value={-2}>All Types</option>
            {DEVICE_TYPE_OPTIONS.map((dt) => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>
        </div>

        {filteredDevices.length !== devices.length && (
          <p className="mb-3 text-xs text-slate-500">
            Showing {filteredDevices.length} of {devices.length} devices
            {(deviceSearch || deviceTypeFilter !== -2) && (
              <button
                className="ml-2 text-cyan-400 hover:text-cyan-300"
                onClick={() => { onSearchChange(''); onTypeFilterChange(-2); }}
                type="button"
              >
                Clear filters
              </button>
            )}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {filteredDevices.map((device) => {
            const isOn = Boolean(device.parameters?.status);
            return (
              <div className={`${styles.deviceCard} ${isOn ? styles.deviceCardOn : ''} p-4`} key={device.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">{device.name}</p>
                    <p className="text-xs text-slate-400">{DEVICE_TYPE_LABELS[device.type] ?? 'Unknown'} &middot; {roomMap.get(device.room_id)?.name ?? '—'}</p>
                  </div>
                  {getDeviceTypeIcon(device.type)}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isOn ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className={`text-xs font-semibold ${isOn ? 'text-emerald-400' : 'text-slate-500'}`}>{isOn ? 'ON' : 'OFF'}</span>
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

                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-cyan-200/20 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-200/40"
                    onClick={() => onEditDevice(device)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                    onClick={() => onDeleteDevice(device.id, device.name)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {devices.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-cyan-500/15 p-8 text-center text-sm text-slate-500">
              No devices yet. Add rooms first, then create devices.
            </p>
          )}
          {devices.length > 0 && filteredDevices.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-cyan-500/15 p-8 text-center text-sm text-slate-500">
              No devices match your search.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
