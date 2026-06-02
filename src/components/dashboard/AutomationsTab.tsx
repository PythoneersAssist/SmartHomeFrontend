import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ConfirmDialog } from '../ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';
import { backendApi } from '../../services/api';
import type { Automation, AutomationCreateInput, Device } from '../../types/domain';
import { AUTOMATION_TRIGGER_LABELS, AUTOMATION_TRIGGER_OPTIONS, DEVICE_TYPE_LABELS } from '../../types/domain';
import { DeviceParamEditor } from './DeviceParamEditor';
import styles from './dashboard.module.css';

type AutomationsTabProps = {
  houseDevices: Device[];
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isTimeTrigger(triggerType: number): boolean {
  return triggerType === 0;
}

function isThresholdTrigger(triggerType: number): boolean {
  return triggerType === 1 || triggerType === 2;
}

function normalizeTimeTriggerValue(value: string): string {
  const raw = value.trim().replace(/\./g, ':');
  const parts = raw.split(':');
  if (parts.length < 2 || parts.length > 3) {
    return raw;
  }

  const [hourPart, minutePart, secondPart] = parts;
  if (!/^\d{1,2}$/.test(hourPart) || !/^\d{1,2}$/.test(minutePart)) {
    return raw;
  }
  if (secondPart !== undefined && !/^\d{1,2}$/.test(secondPart)) {
    return raw;
  }

  const hour = Number(hourPart);
  const minute = Number(minutePart);
  const second = secondPart === undefined ? undefined : Number(secondPart);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return raw;
  }
  if (second !== undefined && (second < 0 || second > 59)) {
    return raw;
  }

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  if (second === undefined) {
    return `${hh}:${mm}`;
  }

  return `${hh}:${mm}:${String(second).padStart(2, '0')}`;
}

type ParsedClock = {
  hour: number;
  minute: number;
  second: number;
  hasSeconds: boolean;
};

function parseClock(value: string): ParsedClock | null {
  const normalized = normalizeTimeTriggerValue(value);
  const parts = normalized.split(':');
  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  const hasSeconds = parts.length === 3;
  const second = hasSeconds ? Number(parts[2]) : 0;

  if ([hour, minute, second].some((part) => Number.isNaN(part))) {
    return null;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null;
  }

  return {
    hour,
    minute,
    second,
    hasSeconds,
  };
}

function localClockToUtcClock(value: string): string {
  const parsed = parseClock(value);
  if (!parsed) {
    return normalizeTimeTriggerValue(value);
  }

  const now = new Date();
  const localDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    parsed.hour,
    parsed.minute,
    parsed.second,
    0,
  );

  const hh = String(localDate.getUTCHours()).padStart(2, '0');
  const mm = String(localDate.getUTCMinutes()).padStart(2, '0');
  const ss = String(localDate.getUTCSeconds()).padStart(2, '0');

  return parsed.hasSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
}

function utcClockToLocalClock(value: string): string {
  const parsed = parseClock(value);
  if (!parsed) {
    return normalizeTimeTriggerValue(value);
  }

  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    parsed.hour,
    parsed.minute,
    parsed.second,
    0,
  ));

  const hh = String(utcDate.getHours()).padStart(2, '0');
  const mm = String(utcDate.getMinutes()).padStart(2, '0');
  const ss = String(utcDate.getSeconds()).padStart(2, '0');

  return parsed.hasSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
}

function isValidTimeTriggerValue(value: string): boolean {
  const normalized = normalizeTimeTriggerValue(value);
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(normalized);
}

export function AutomationsTab({ houseDevices }: AutomationsTabProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formTriggerType, setFormTriggerType] = useState(0);
  const [formTriggerValue, setFormTriggerValue] = useState('');
  const [formExecutionDay, setFormExecutionDay] = useState<string>('');
  const [formDeviceId, setFormDeviceId] = useState('');
  const [formDeviceType, setFormDeviceType] = useState(0);
  const [formTurnOn, setFormTurnOn] = useState(true);
  const [formParameters, setFormParameters] = useState<Record<string, unknown>>({});

  const [editing, setEditing] = useState<Automation | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { addToast } = useToast();

  const deviceMap = new Map(houseDevices.map((d) => [d.id, d]));

  // Temperature/lux automations only *fire* when the house has a qualifying
  // sensor. Creation is still allowed — show a non-blocking warning so the user
  // knows the rule won't trigger until they add the device.
  const hasThermostat = houseDevices.some((d) => d.type === 4);
  const hasLightSensor = houseDevices.some((d) => d.type === 0 || d.type === 1);

  function sensorWarning(triggerType: number): string | null {
    if (triggerType === 1 && !hasThermostat) {
      return "This temperature automation won't run until you add a thermostat to this house.";
    }
    if (triggerType === 2 && !hasLightSensor) {
      return "This light automation won't run until you add a light or LED strip to this house.";
    }
    return null;
  }

  async function loadAutomations() {
    setLoading(true);
    setError(null);
    try {
      const data = await backendApi.getAutomations();
      const houseDeviceIds = new Set(houseDevices.map((d) => d.id));
      setAutomations(
        data
          .filter((a) => houseDeviceIds.has(a.device_id))
          .map((a) => {
            if (isTimeTrigger(a.trigger_type) && a.trigger_value) {
              return {
                ...a,
                trigger_value: utcClockToLocalClock(a.trigger_value),
              };
            }
            return a;
          }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAutomations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houseDevices]);

  useEffect(() => {
    if (houseDevices.length > 0 && !formDeviceId) {
      const firstDevice = houseDevices[0];
      setFormDeviceId(firstDevice.id);
      setFormDeviceType(firstDevice.type);
      setFormParameters({ ...firstDevice.parameters });
    }
  }, [houseDevices, formDeviceId]);

  function resetForm() {
    setFormName('');
    setFormTriggerType(0);
    setFormTriggerValue('');
    setFormExecutionDay('');
    const firstDevice = houseDevices[0];
    setFormDeviceId(firstDevice?.id ?? '');
    setFormDeviceType(firstDevice?.type ?? 0);
    setFormTurnOn(true);
    setFormParameters(firstDevice?.parameters ? { ...firstDevice.parameters } : {});
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const normalizedCreateTime = isTimeTrigger(formTriggerType)
        ? normalizeTimeTriggerValue(formTriggerValue)
        : formTriggerValue.trim();
      const createPayloadTime = isTimeTrigger(formTriggerType)
        ? localClockToUtcClock(normalizedCreateTime)
        : normalizedCreateTime;

      if (isTimeTrigger(formTriggerType) && !isValidTimeTriggerValue(normalizedCreateTime)) {
        setError('Time automations require trigger value in HH:MM or HH:MM:SS format.');
        return;
      }

      if (isThresholdTrigger(formTriggerType) && formTriggerValue.trim().length > 0 && Number.isNaN(Number(formTriggerValue))) {
        setError('Threshold value must be numeric for temperature or lux automations.');
        return;
      }

      if (isTimeTrigger(formTriggerType) && normalizedCreateTime !== formTriggerValue) {
        setFormTriggerValue(normalizedCreateTime);
      }

      const filteredParams = Object.entries(formParameters)
        .filter(([key]) => key !== 'status')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      const payload: AutomationCreateInput = {
        name: formName,
        trigger_type: formTriggerType,
        trigger_value: createPayloadTime || undefined,
        execution_day: formExecutionDay ? Number(formExecutionDay) : undefined,
        device_id: formDeviceId,
        turn_on: formTurnOn,
        parameters: Object.keys(filteredParams).length > 0 ? filteredParams : undefined,
      };
      await backendApi.createAutomation(payload);
      resetForm();
      setShowCreateModal(false);
      await loadAutomations();
      addToast('Automation created successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create automation');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setError(null);
    try {
      const editingValue = editing.trigger_value?.trim() ?? '';
      const normalizedEditTime = isTimeTrigger(editing.trigger_type)
        ? normalizeTimeTriggerValue(editingValue)
        : editingValue;
      const updatePayloadTime = isTimeTrigger(editing.trigger_type)
        ? localClockToUtcClock(normalizedEditTime)
        : normalizedEditTime;

      if (isTimeTrigger(editing.trigger_type) && !isValidTimeTriggerValue(normalizedEditTime)) {
        setError('Time automations require trigger value in HH:MM or HH:MM:SS format.');
        return;
      }

      if (isThresholdTrigger(editing.trigger_type) && editingValue.length > 0 && Number.isNaN(Number(editingValue))) {
        setError('Threshold value must be numeric for temperature or lux automations.');
        return;
      }

      if (isTimeTrigger(editing.trigger_type) && normalizedEditTime !== editingValue) {
        setEditing((prev) => prev ? { ...prev, trigger_value: normalizedEditTime } : prev);
      }

      const filteredParams = editing.parameters
        ? Object.entries(editing.parameters)
          .filter(([key]) => key !== 'status')
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
        : {};

      await backendApi.updateAutomation({
        automation_id: editing.id,
        name: editing.name,
        trigger_type: editing.trigger_type,
        trigger_value: updatePayloadTime || undefined,
        execution_day: editing.execution_day ?? undefined,
        turn_on: editing.turn_on,
        parameters: Object.keys(filteredParams).length > 0 ? filteredParams : undefined,
      });
      setEditing(null);
      await loadAutomations();
      addToast('Automation updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update automation');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setSubmitting(true);
    setError(null);
    try {
      await backendApi.deleteAutomation(id);
      await loadAutomations();
      addToast('Automation deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete automation');
    } finally {
      setSubmitting(false);
    }
  }

  function getTriggerPlaceholder(type: number) {
    switch (type) {
      case 0: return 'e.g. 19:30';
      case 1: return 'e.g. 22.5 (°C)';
      case 2: return 'e.g. 500 (lux)';
      default: return 'Value';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{error}</p>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className={`${styles.sectionTitle} text-slate-300`}>Automations</p>
          <button
            aria-label="Add automation"
            className={styles.addAction}
            disabled={houseDevices.length === 0}
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            +
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {automations.map((auto) => {
            const device = deviceMap.get(auto.device_id);
            return (
              <div className={`${styles.roomCard} p-4`} key={auto.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">{auto.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {device?.name ?? 'Unknown device'} &middot; {DEVICE_TYPE_LABELS[device?.type ?? -1] ?? 'Unknown'}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
                    <svg className="h-4 w-4 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-emerald-500/12 px-2 py-1 text-xs font-semibold text-emerald-300">
                    {AUTOMATION_TRIGGER_LABELS[auto.trigger_type] ?? 'Unknown'}
                  </span>
                  {auto.trigger_value && (
                    <span className="rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-slate-300">
                      {auto.trigger_value}
                    </span>
                  )}
                  {auto.execution_day !== null && auto.execution_day !== undefined && (
                    <span className="rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-slate-300">
                      {WEEKDAY_LABELS[auto.execution_day] ?? `Day ${auto.execution_day}`}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-white/15 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300/45"
                    onClick={() => setEditing(auto)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                    onClick={() => setPendingDeleteId(auto.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {automations.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
              No automations yet. Create one to get started.
            </p>
          )}
        </div>
      </section>

      {showCreateModal && (
        <section className={`${styles.modal} fixed inset-0 z-20 grid place-items-center px-4`}>
          <form className={`${styles.modalCard} w-full max-w-lg p-6 shadow-2xl`} onSubmit={handleCreate}>
            <h3 className="text-xl font-extrabold text-white">Add Automation</h3>
            <p className="mb-4 mt-1 text-sm text-slate-400">Create a rule to automate a device.</p>

            <div className="grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                Name
                <input
                  className={styles.formInput}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Turn on at sunset"
                  required
                  value={formName}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                Device
                <select
                  className={styles.formInput}
                  onChange={(e) => {
                    setFormDeviceId(e.target.value);
                    const selectedDevice = houseDevices.find((d) => d.id === e.target.value);
                    setFormDeviceType(selectedDevice?.type ?? 0);
                    setFormParameters(selectedDevice?.parameters ? { ...selectedDevice.parameters } : {});
                  }}
                  required
                  value={formDeviceId}
                >
                  {houseDevices.length === 0 && <option value="">No devices</option>}
                  {houseDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({DEVICE_TYPE_LABELS[d.type] ?? 'Unknown'})
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                  Trigger
                  <select
                    className={styles.formInput}
                    onChange={(e) => {
                      const nextType = Number(e.target.value);
                      setFormTriggerType(nextType);
                      setFormTriggerValue('');
                      if (!isTimeTrigger(nextType)) {
                        setFormExecutionDay('');
                      }
                    }}
                    required
                    value={formTriggerType}
                  >
                    {AUTOMATION_TRIGGER_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                  Value
                  <input
                    className={styles.formInput}
                    onChange={(e) => setFormTriggerValue(e.target.value)}
                    placeholder={getTriggerPlaceholder(formTriggerType)}
                    required={isTimeTrigger(formTriggerType)}
                    step={isTimeTrigger(formTriggerType) ? 1 : undefined}
                    type={isTimeTrigger(formTriggerType) ? 'time' : isThresholdTrigger(formTriggerType) ? 'number' : 'text'}
                    value={formTriggerValue}
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500">
                {isTimeTrigger(formTriggerType)
                  ? 'Enter local time (HH:MM or HH:MM:SS). It is converted to UTC automatically when saved.'
                  : 'Temperature and lux triggers are checked when device parameters are updated.'}
              </p>
              {sensorWarning(formTriggerType) && (
                <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  ⚠️ {sensorWarning(formTriggerType)}
                </p>
              )}
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                Day of Week (optional)
                <select
                  className={styles.formInput}
                  onChange={(e) => setFormExecutionDay(e.target.value)}
                  disabled={!isTimeTrigger(formTriggerType)}
                  value={formExecutionDay}
                >
                  <option value="">Every day</option>
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <option key={idx} value={idx}>{label}</option>
                  ))}
                </select>
              </label>
              {Object.entries(formParameters).filter(([key]) => key !== 'status').length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold text-slate-300">Device Parameters (optional)</p>
                  <DeviceParamEditor
                    deviceType={formDeviceType}
                    parameters={Object.fromEntries(
                      Object.entries(formParameters).filter(([key]) => key !== 'status')
                    )}
                    onChange={(key, value) => setFormParameters((prev) => ({ ...prev, [key]: value }))}
                  />
                </div>
              )}
              <label className="flex gap-3 items-center text-sm font-semibold text-slate-200">
                <span className="flex-1">Device Action: {formTurnOn ? 'Turn ON' : 'Turn OFF'}</span>
                <div className="relative h-7 w-14 rounded-full bg-slate-700 transition-colors" style={{ backgroundColor: formTurnOn ? '#22c55e' : '#64748b' }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    value={formTurnOn ? 1 : 0}
                    onChange={(e) => setFormTurnOn(e.target.value === '1')}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div
                    className="absolute top-1 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                    style={{ transform: formTurnOn ? 'translateX(28px)' : 'translateX(2px)' }}
                  />
                </div>
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-bold text-slate-900"
                disabled={submitting || houseDevices.length === 0}
                type="submit"
              >
                {submitting ? 'Adding...' : 'Add Automation'}
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

      {/* Edit Modal */}
      {editing && (
        <section className={`${styles.modal} fixed inset-0 z-20 grid place-items-center px-4`}>
          <form className={`${styles.modalCard} w-full max-w-md p-6 shadow-2xl`} onSubmit={handleUpdate}>
            <h3 className="text-xl font-extrabold text-white">Update Automation</h3>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                Name
                <input
                  className={styles.formInput}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  value={editing.name}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                  Trigger
                  <select
                    className={styles.formInput}
                    onChange={(e) => {
                      const nextType = Number(e.target.value);
                      setEditing((prev) => {
                        if (!prev) {
                          return prev;
                        }

                        return {
                          ...prev,
                          trigger_type: nextType,
                          trigger_value: '',
                          execution_day: isTimeTrigger(nextType) ? prev.execution_day : null,
                        };
                      });
                    }}
                    value={editing.trigger_type}
                  >
                    {AUTOMATION_TRIGGER_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                  Value
                  <input
                    className={styles.formInput}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, trigger_value: e.target.value } : prev)}
                    placeholder={getTriggerPlaceholder(editing.trigger_type)}
                    required={isTimeTrigger(editing.trigger_type)}
                    step={isTimeTrigger(editing.trigger_type) ? 1 : undefined}
                    type={isTimeTrigger(editing.trigger_type) ? 'time' : isThresholdTrigger(editing.trigger_type) ? 'number' : 'text'}
                    value={editing.trigger_value ?? ''}
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500">
                {isTimeTrigger(editing.trigger_type)
                  ? 'Enter local time (HH:MM or HH:MM:SS). It is converted to UTC automatically when saved.'
                  : 'Temperature and lux triggers are checked when device parameters are updated.'}
              </p>
              {sensorWarning(editing.trigger_type) && (
                <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  ⚠️ {sensorWarning(editing.trigger_type)}
                </p>
              )}
              <label className="grid gap-1.5 text-sm font-semibold text-slate-200">
                Day of Week
                <select
                  className={styles.formInput}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, execution_day: e.target.value ? Number(e.target.value) : null } : prev)}
                  disabled={!isTimeTrigger(editing.trigger_type)}
                  value={editing.execution_day ?? ''}
                >
                  <option value="">Every day</option>
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <option key={idx} value={idx}>{label}</option>
                  ))}
                </select>
              </label>
              {editing.parameters && Object.entries(editing.parameters).filter(([key]) => key !== 'status').length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold text-slate-300">Device Parameters (optional)</p>
                  <DeviceParamEditor
                    deviceType={deviceMap.get(editing.device_id)?.type ?? 0}
                    parameters={Object.fromEntries(
                      Object.entries(editing.parameters).filter(([key]) => key !== 'status')
                    )}
                    onChange={(key, value) => setEditing((prev) => prev ? { ...prev, parameters: { ...prev.parameters, [key]: value } } : prev)}
                  />
                </div>
              )}
              <label className="flex gap-3 items-center text-sm font-semibold text-slate-200">
                <span className="flex-1">Device Action: {editing.turn_on ? 'Turn ON' : 'Turn OFF'}</span>
                <div className="relative h-7 w-14 rounded-full bg-slate-700 transition-colors" style={{ backgroundColor: editing.turn_on ? '#22c55e' : '#64748b' }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    value={editing.turn_on ? 1 : 0}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, turn_on: e.target.value === '1' } : prev)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div
                    className="absolute top-1 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                    style={{ transform: editing.turn_on ? 'translateX(28px)' : 'translateX(2px)' }}
                  />
                </div>
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-bold text-slate-900"
                disabled={submitting}
                type="submit"
              >
                Save
              </button>
              <button
                className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300"
                onClick={() => setEditing(null)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete Automation"
        message={`Are you sure you want to delete this automation? This action cannot be undone.`}
        onConfirm={() => {
          if (pendingDeleteId) void handleDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}
