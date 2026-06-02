import { useEffect, useRef, useState } from 'react';
import type { Device, Preset } from '../../types/domain';
import { DEVICE_TYPE_LABELS } from '../../types/domain';
import { backendApi } from '../../services/api';
import { DeviceParamEditor } from './DeviceParamEditor';
import styles from './dashboard.module.css';

type Props = {
  device: Device;
  roomName: string;
  isFavorite: boolean;
  onToggleFavorite: (deviceId: string) => void;
  onToggleDevice: (device: Device) => void;
  onSaveDeviceSettings: (device: Device, parameters: Record<string, unknown>) => Promise<void>;
  onApplyPreset: (device: Device, presetId: string) => Promise<void>;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (deviceId: string, deviceName: string) => void;
  submitting: boolean;
};

export function DeviceControlCard({
  device,
  roomName,
  isFavorite,
  onToggleFavorite,
  onToggleDevice,
  onSaveDeviceSettings,
  onApplyPreset,
  onEditDevice,
  onDeleteDevice,
  submitting,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [paramDraft, setParamDraft] = useState<Record<string, unknown> | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);
  const presetsRequested = useRef(false);

  // Lazy-load the server-driven preset catalog the first time the card is
  // expanded. Only devices with matching presets show a "Presets" section.
  useEffect(() => {
    if (!expanded || presetsRequested.current) {
      return;
    }

    presetsRequested.current = true;
    let cancelled = false;
    backendApi
      .getPresets(device.type)
      .then((data) => {
        if (!cancelled) setPresets(data);
      })
      .catch(() => {
        if (!cancelled) setPresets([]);
      });

    return () => {
      cancelled = true;
    };
  }, [expanded, device.type]);

  const isOn = device.parameters?.status === true;
  // Thermostats carry a live `temperature` reading that the backend simulation
  // updates over the notifications socket. Surface it on the card so the value
  // is visible without expanding the controls.
  const temperatureReading = device.type === 4 && typeof device.parameters?.temperature === 'number'
    ? (device.parameters.temperature as number)
    : null;
  const baseParams = (device.parameters as Record<string, unknown>) ?? {};
  const draftParams = paramDraft ?? baseParams;
  const hasParamChanges = JSON.stringify(draftParams) !== JSON.stringify(baseParams);

  function setDraftParameter(key: string, value: unknown): void {
    setParamDraft((prev) => {
      const current = prev ?? baseParams;
      return {
        ...current,
        [key]: value,
      };
    });
  }

  return (
    <div
      className={`${styles.deviceCard} ${styles.deviceCardExpandable} ${expanded ? styles.deviceCardExpanded : ''} ${isOn ? styles.deviceCardOn : ''} p-4`}
      key={device.id}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold text-white">{device.name}</p>
          <p className="truncate text-xs text-slate-400">{DEVICE_TYPE_LABELS[device.type] ?? 'Unknown'} &middot; {roomName}</p>
          {temperatureReading !== null && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-200">
              🌡 {temperatureReading.toFixed(1)}°C
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
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

          <button
            aria-label={expanded ? 'Collapse device details' : 'Expand device details'}
            className={styles.deviceDetailsToggle}
            onClick={() => setExpanded((prev) => !prev)}
            type="button"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.deviceExpandSection}>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Device Controls</p>

        <div className="mt-3">
          <DeviceParamEditor
            deviceType={device.type}
            parameters={draftParams}
            onChange={(key, value) => setDraftParameter(key, value)}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-white/15 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300/45 disabled:opacity-50"
            disabled={!hasParamChanges || submitting}
            onClick={() => {
              void onSaveDeviceSettings(device, draftParams).then(() => {
                setParamDraft(null);
              });
            }}
            type="button"
          >
            Save Controls
          </button>

          {hasParamChanges && (
            <button
              className="rounded-lg border border-white/15 bg-slate-900/55 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/25"
              onClick={() => setParamDraft(null)}
              type="button"
            >
              Reset
            </button>
          )}

          <button
            className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            onClick={() => onEditDevice(device)}
            type="button"
          >
            Edit Device
          </button>

          <button
            aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${isFavorite ? 'border-amber-300/45 bg-amber-400/15 text-amber-200' : 'border-white/15 bg-black/30 text-slate-300 hover:text-amber-200'}`}
            onClick={() => onToggleFavorite(device.id)}
            type="button"
          >
            {isFavorite ? 'Unfavorite' : 'Favorite'}
          </button>

          <button
            className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
            onClick={() => onDeleteDevice(device.id, device.name)}
            type="button"
          >
            Delete
          </button>
        </div>

        {presets.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Presets</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  className="rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-50"
                  disabled={submitting || applyingPresetId !== null}
                  key={preset.id}
                  onClick={() => {
                    setApplyingPresetId(preset.id);
                    void onApplyPreset(device, preset.id).finally(() => setApplyingPresetId(null));
                  }}
                  title={preset.description}
                  type="button"
                >
                  {applyingPresetId === preset.id ? 'Applying…' : preset.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
