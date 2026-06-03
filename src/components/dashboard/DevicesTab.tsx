import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Device, Room } from '../../types/domain';
import { DEVICE_TYPE_OPTIONS, PICTURE_MODE_OPTIONS, DEFAULT_PICTURE_MODE } from '../../types/domain';

// Device type id for TV (see DEVICE_TYPE_LABELS).
const TV_DEVICE_TYPE = 10;
import { DeviceControlCard } from './DeviceControlCard';
import type { DeviceFormState } from './types';
import styles from './dashboard.module.css';

type Props = {
  devices: Device[];
  filteredDevices: Device[];
  rooms: Room[];
  roomMap: Map<string, Room>;
  deviceForm: DeviceFormState;
  onDeviceFormChange: (form: DeviceFormState) => void;
  onCreateDevice: (e: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onEditDevice: (device: Device) => void;
  onSaveDeviceSettings: (device: Device, parameters: Record<string, unknown>) => Promise<void>;
  onApplyPreset: (device: Device, presetId: string) => Promise<void>;
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
  onCreateDevice, onEditDevice, onSaveDeviceSettings, onApplyPreset, onDeleteDevice, onToggleDevice,
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

        <div className="grid items-start gap-3 sm:grid-cols-2">
          {filteredDevices.map((device) => (
            <DeviceControlCard
              device={device}
              isFavorite={favoriteDeviceIds.has(device.id)}
              key={device.id}
              onDeleteDevice={onDeleteDevice}
              onEditDevice={onEditDevice}
              onSaveDeviceSettings={onSaveDeviceSettings}
              onApplyPreset={onApplyPreset}
              onToggleDevice={onToggleDevice}
              onToggleFavorite={onToggleFavorite}
              roomName={roomMap.get(device.room_id)?.name ?? '—'}
              submitting={submitting}
            />
          ))}
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
            onSubmit={async (e) => {
              const created = await onCreateDevice(e);
              if (created) {
                setShowCreateModal(false);
              }
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
                    onChange={(e) => {
                      const device_type = Number(e.target.value);
                      // Seed type-specific defaults; drop params that no longer apply.
                      const parameters = device_type === TV_DEVICE_TYPE
                        ? { picture_mode: DEFAULT_PICTURE_MODE }
                        : {};
                      onDeviceFormChange({ ...deviceForm, device_type, parameters });
                    }}
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

              {deviceForm.device_type === TV_DEVICE_TYPE && (
                <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                  Picture Mode
                  <select
                    className={styles.formInput}
                    onChange={(e) => onDeviceFormChange({
                      ...deviceForm,
                      parameters: { ...deviceForm.parameters, picture_mode: e.target.value },
                    })}
                    value={(deviceForm.parameters.picture_mode as string) ?? DEFAULT_PICTURE_MODE}
                  >
                    {PICTURE_MODE_OPTIONS.map((pm) => (
                      <option key={pm.value} value={pm.value}>{pm.label}</option>
                    ))}
                  </select>
                </label>
              )}
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
