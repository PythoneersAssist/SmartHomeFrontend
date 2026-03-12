import { useCallback } from 'react';
import type { ParamControl } from '../../types/domain';
import { DEVICE_PARAM_CONTROLS } from '../../types/domain';
import styles from './dashboard.module.css';

const PARAM_KEY_MAP: Record<string, string> = {
  rgb: 'color',
  fan_power: 'slider',
  temperature: 'temperature',
  target_temperature: 'temperature',
  setting: 'select',
  volume: 'slider',
  power_setting: 'slider',
  power: 'slider',
  wash_type: 'select',
};

function findControl(deviceType: number, paramKey: string): ParamControl | null {
  const controls = DEVICE_PARAM_CONTROLS[deviceType];
  if (!controls) return null;

  const kindHint = PARAM_KEY_MAP[paramKey];
  if (!kindHint) return null;

  if (paramKey === 'temperature') {
    return controls.find((c) => c.kind === 'temperature' && c.label === 'Temperature') ?? controls.find((c) => c.kind === 'temperature') ?? null;
  }
  if (paramKey === 'target_temperature') {
    return controls.find((c) => c.kind === 'temperature' && c.label.toLowerCase().includes('target')) ?? controls.find((c) => c.kind === 'temperature') ?? null;
  }
  if (paramKey === 'power_setting') {
    return controls.find((c) => c.label.toLowerCase().includes('power setting')) ?? null;
  }
  if (paramKey === 'power') {
    return controls.find((c) => c.kind === 'slider' && c.label === 'Power') ?? null;
  }

  return controls.find((c) => c.kind === kindHint) ?? null;
}

type Props = {
  deviceType: number;
  parameters: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
};

export function DeviceParamEditor({ deviceType, parameters, onChange }: Props) {
  const entries = Object.entries(parameters).filter(([key]) => key !== 'status');

  return (
    <div className="grid gap-3">
      {entries.map(([key, val]) => {
        const control = findControl(deviceType, key);

        if (control?.kind === 'color' && key === 'rgb') {
          return <ColorPicker key={key} label={control.label} value={val as number[]} onChange={(v) => onChange(key, v)} />;
        }

        if (control?.kind === 'slider') {
          return (
            <SliderControl
              key={key}
              label={control.label}
              value={Number(val)}
              min={control.min}
              max={control.max}
              step={control.step}
              unit={control.unit}
              onChange={(v) => onChange(key, v)}
            />
          );
        }

        if (control?.kind === 'temperature') {
          return (
            <TemperatureControl
              key={key}
              label={control.label}
              value={Number(val)}
              min={control.min}
              max={control.max}
              step={control.step}
              unit={control.unit}
              onChange={(v) => onChange(key, v)}
            />
          );
        }

        if (control?.kind === 'select') {
          return (
            <SelectControl
              key={key}
              label={control.label}
              value={Number(val)}
              options={control.options}
              onChange={(v) => onChange(key, v)}
            />
          );
        }

        return (
          <label className="grid gap-1.5 text-sm font-semibold text-cyan-100" key={key}>
            {key}
            <input
              className={styles.formInput}
              onChange={(e) => onChange(key, typeof val === 'number' ? Number(e.target.value) : e.target.value)}
              type={typeof val === 'number' ? 'number' : 'text'}
              value={String(val)}
            />
          </label>
        );
      })}

      {entries.length === 0 && (
        <p className="text-xs text-slate-500">This device has no configurable parameters beyond on/off.</p>
      )}
    </div>
  );
}

// ─── Color Picker (RGB) ────────────────────────

function rgbToHex([r, g, b]: number[]): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex: string): number[] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function ColorPicker({ label, value, onChange }: { label: string; value: number[]; onChange: (v: number[]) => void }) {
  const hex = rgbToHex(value);

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-semibold text-cyan-100">{label}</span>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            className="h-10 w-14 cursor-pointer rounded-lg border border-cyan-200/20 bg-transparent"
            onChange={(e) => onChange(hexToRgb(e.target.value))}
            type="color"
            value={hex}
          />
        </div>
        <div className="flex gap-1.5">
          {['R', 'G', 'B'].map((ch, i) => (
            <label className="grid gap-0.5 text-center" key={ch}>
              <span className="text-[10px] font-bold text-slate-500">{ch}</span>
              <input
                className="w-14 rounded-lg border border-cyan-200/15 bg-slate-950/60 px-2 py-1.5 text-center text-xs text-white focus:border-cyan-300 focus:outline-none"
                max={255}
                min={0}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = Math.min(255, Math.max(0, Number(e.target.value) || 0));
                  onChange(next);
                }}
                type="number"
                value={value[i]}
              />
            </label>
          ))}
        </div>
        <div
          className="h-10 w-10 rounded-lg border border-cyan-200/20"
          style={{ backgroundColor: hex }}
        />
      </div>
    </div>
  );
}

// ─── Slider Control ────────────────────────────

function SliderControl({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value)),
    [onChange],
  );

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-cyan-100">{label}</span>
        <span className="text-sm font-bold text-white">
          {value}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="relative">
        <input
          className="w-full appearance-none rounded-lg bg-slate-800/80 h-2 cursor-pointer accent-cyan-400
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.5)]"
          max={max}
          min={min}
          onChange={handleChange}
          step={step}
          type="range"
          value={value}
        />
        <div
          className="pointer-events-none absolute top-0 left-0 h-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ─── Temperature Control ────────────────────────

function TemperatureControl({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  const ratio = (value - min) / (max - min);
  const tempColor = ratio < 0.3 ? 'text-blue-400' : ratio < 0.6 ? 'text-emerald-400' : ratio < 0.8 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-cyan-100">{label}</span>
        <span className={`text-lg font-black ${tempColor}`}>
          {value}{unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-200/20 bg-slate-800/60 text-lg font-bold text-cyan-300 transition hover:bg-cyan-500/15"
          onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))}
          type="button"
        >
          −
        </button>
        <input
          className="flex-1 appearance-none rounded-lg bg-slate-800/80 h-2 cursor-pointer accent-cyan-400
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.5)]"
          max={max}
          min={min}
          onChange={(e) => onChange(Number(e.target.value))}
          step={step}
          type="range"
          value={value}
        />
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-200/20 bg-slate-800/60 text-lg font-bold text-cyan-300 transition hover:bg-cyan-500/15"
          onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))}
          type="button"
        >
          +
        </button>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ─── Select Control ─────────────────────────────

function SelectControl({
  label, value, options, onChange,
}: {
  label: string; value: number; options: { value: number; label: string }[]; onChange: (v: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-semibold text-cyan-100">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              value === opt.value
                ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                : 'border-cyan-200/10 bg-slate-800/50 text-slate-400 hover:border-cyan-200/25 hover:text-slate-300'
            }`}
            key={opt.value}
            onClick={() => onChange(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
