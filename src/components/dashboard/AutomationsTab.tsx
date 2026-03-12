import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ConfirmDialog } from '../ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';
import { backendApi } from '../../services/api';
import type { Automation, AutomationCreateInput, Device } from '../../types/domain';
import { AUTOMATION_TRIGGER_LABELS, AUTOMATION_TRIGGER_OPTIONS, DEVICE_TYPE_LABELS } from '../../types/domain';
import styles from './dashboard.module.css';

type AutomationsTabProps = {
  houseDevices: Device[];
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  const [editing, setEditing] = useState<Automation | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();

  const deviceMap = new Map(houseDevices.map((d) => [d.id, d]));

  async function loadAutomations() {
    setLoading(true);
    setError(null);
    try {
      const data = await backendApi.getAutomations();
      const houseDeviceIds = new Set(houseDevices.map((d) => d.id));
      setAutomations(data.filter((a) => houseDeviceIds.has(a.device_id)));
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
      setFormDeviceId(houseDevices[0].id);
    }
  }, [houseDevices, formDeviceId]);

  function resetForm() {
    setFormName('');
    setFormTriggerType(0);
    setFormTriggerValue('');
    setFormExecutionDay('');
    setFormDeviceId(houseDevices[0]?.id ?? '');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: AutomationCreateInput = {
        name: formName,
        trigger_type: formTriggerType,
        trigger_value: formTriggerValue || undefined,
        execution_day: formExecutionDay ? Number(formExecutionDay) : undefined,
        device_id: formDeviceId,
      };
      await backendApi.createAutomation(payload);
      resetForm();
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
      await backendApi.updateAutomation({
        automation_id: editing.id,
        name: editing.name,
        trigger_type: editing.trigger_type,
        trigger_value: editing.trigger_value ?? undefined,
        execution_day: editing.execution_day ?? undefined,
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{error}</p>
      )}

      <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* Create Form */}
        <form className="rounded-2xl border border-cyan-200/10 bg-slate-900/50 p-5" onSubmit={handleCreate}>
          <h2 className="text-lg font-extrabold text-white">Add Automation</h2>
          <p className="mb-4 mt-1 text-sm text-slate-400">Create a rule to automate a device.</p>

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
              Name
              <input
                className={styles.formInput}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Turn on at sunset"
                required
                value={formName}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
              Device
              <select
                className={styles.formInput}
                onChange={(e) => setFormDeviceId(e.target.value)}
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
              <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
                Trigger
                <select
                  className={styles.formInput}
                  onChange={(e) => setFormTriggerType(Number(e.target.value))}
                  required
                  value={formTriggerType}
                >
                  {AUTOMATION_TRIGGER_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
                Value
                <input
                  className={styles.formInput}
                  onChange={(e) => setFormTriggerValue(e.target.value)}
                  placeholder={getTriggerPlaceholder(formTriggerType)}
                  value={formTriggerValue}
                />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
              Day of Week (optional)
              <select
                className={styles.formInput}
                onChange={(e) => setFormExecutionDay(e.target.value)}
                value={formExecutionDay}
              >
                <option value="">Every day</option>
                {WEEKDAY_LABELS.map((label, idx) => (
                  <option key={idx} value={idx}>{label}</option>
                ))}
              </select>
            </label>
            <button
              className="mt-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 font-bold text-slate-900 transition hover:-translate-y-0.5"
              disabled={submitting || houseDevices.length === 0}
              type="submit"
            >
              {submitting ? 'Adding...' : 'Add Automation'}
            </button>
          </div>
        </form>

        {/* Automation List */}
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
                  <span className="rounded-lg bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300">
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
                    className="rounded-lg border border-cyan-200/20 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-200/40"
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
            <p className="col-span-full rounded-xl border border-dashed border-cyan-500/15 p-8 text-center text-sm text-slate-500">
              No automations yet. Create one to get started.
            </p>
          )}
        </div>
      </section>

      {/* Edit Modal */}
      {editing && (
        <section className={`${styles.modal} fixed inset-0 z-20 grid place-items-center px-4`}>
          <form className={`${styles.modalCard} w-full max-w-md p-6 shadow-2xl`} onSubmit={handleUpdate}>
            <h3 className="text-xl font-extrabold text-white">Update Automation</h3>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
                Name
                <input
                  className={styles.formInput}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  value={editing.name}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
                  Trigger
                  <select
                    className={styles.formInput}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, trigger_type: Number(e.target.value) } : prev)}
                    value={editing.trigger_type}
                  >
                    {AUTOMATION_TRIGGER_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
                  Value
                  <input
                    className={styles.formInput}
                    onChange={(e) => setEditing((prev) => prev ? { ...prev, trigger_value: e.target.value } : prev)}
                    placeholder={getTriggerPlaceholder(editing.trigger_type)}
                    value={editing.trigger_value ?? ''}
                  />
                </label>
              </div>
              <label className="grid gap-1.5 text-sm font-semibold text-cyan-100">
                Day of Week
                <select
                  className={styles.formInput}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, execution_day: e.target.value ? Number(e.target.value) : null } : prev)}
                  value={editing.execution_day ?? ''}
                >
                  <option value="">Every day</option>
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <option key={idx} value={idx}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-900"
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
