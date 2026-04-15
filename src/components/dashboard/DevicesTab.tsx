import { useState } from 'react';
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
  favoriteDeviceIds: Set<string>;
  onToggleFavorite: (deviceId: string) => void;
  submitting: boolean;
};

export function DevicesTab({
  devices, filteredDevices, rooms, roomMap, deviceForm, onDeviceFormChange,
  onCreateDevice, onEditDevice, onDeleteDevice, onToggleDevice,
  deviceSearch, onSearchChange, deviceTypeFilter, onTypeFilterChange, submitting,
  favoriteDeviceIds, onToggleFavorite,
}: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className={`${styles.sectionTitle} text-slate-300`}>Devices</p>
          <button
            aria-label="Add device"
            className={styles.addAction}
            disabled={rooms.length === 0}
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            +
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className={`${styles.formInput} ${styles.formInputWithIcon}`}
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
                className="ml-2 text-emerald-300 hover:text-emerald-300"
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
            const isFavorite = favoriteDeviceIds.has(device.id);
            return (
              <div className={`${styles.deviceCard} ${isOn ? styles.deviceCardOn : ''} p-4`} key={device.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-white">{device.name}</p>
                    <p className="text-xs text-slate-400">{DEVICE_TYPE_LABELS[device.type] ?? 'Unknown'} &middot; {roomMap.get(device.room_id)?.name ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                      className={`rounded-lg border px-2 py-1 transition ${isFavorite ? 'border-amber-300/45 bg-amber-400/15 text-amber-200' : 'border-white/15 bg-black/30 text-slate-400 hover:text-amber-200'}`}
                      onClick={() => onToggleFavorite(device.id)}
                      type="button"
                    >
                      <svg className="h-3.5 w-3.5" fill={isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.012 3.114a1 1 0 00.95.69h3.276c.969 0 1.371 1.24.588 1.81l-2.65 1.925a1 1 0 00-.364 1.118l1.012 3.114c.3.922-.755 1.688-1.538 1.118l-2.65-1.925a1 1 0 00-1.175 0l-2.65 1.925c-.783.57-1.838-.196-1.539-1.118l1.013-3.114a1 1 0 00-.364-1.118L4.223 8.54c-.783-.57-.38-1.81.588-1.81h3.276a1 1 0 00.95-.69l1.012-3.114z" />
                      </svg>
                    </button>
                    {getDeviceTypeIcon(device.type)}
                  </div>
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
                    className="rounded-lg border border-white/15 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300/45"
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
            <p className="col-span-full rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
              No devices yet. Add rooms first, then create devices.
            </p>
          )}
          {devices.length > 0 && filteredDevices.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
              No devices match your search.
            </p>
          )}
        </div>
      </section>

      {showCreateModal && (
        <section className={`${styles.modal} fixed inset-0 z-20 grid place-items-center px-4`}>
          <form
            className={`${styles.modalCard} w-full max-w-lg p-6 shadow-2xl`}
            onSubmit={(e) => {
              onCreateDevice(e);
              setShowCreateModal(false);
            }}
          >
            <h3 className="text-xl font-extrabold text-white">Add Device</h3>
            <p className="mb-4 mt-1 text-sm text-slate-400">Devices are assigned to one of this house's rooms.</p>

            <div className="grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
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
                <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
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
                <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
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
            </div>

            <div className="mt-5 flex gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-bold text-slate-900"
                disabled={submitting || rooms.length === 0}
                type="submit"
              >
                {submitting ? 'Adding...' : 'Add Device'}
              </button>
              <button
                className="rounded-xl border border-white/20 bg-black/35 px-4 py-2.5 text-sm font-semibold text-slate-300"
                onClick={() => setShowCreateModal(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
