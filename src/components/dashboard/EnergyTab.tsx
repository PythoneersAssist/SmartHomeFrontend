import { useEffect, useMemo, useState } from 'react';
import { backendApi } from '../../services/api';
import { localData } from '../../services/storage';
import type { DeviceEnergy, EnergyHistoryPoint, EnergyHistoryResponse, HouseholdEnergy } from '../../types/domain';
import { DEVICE_TYPE_LABELS } from '../../types/domain';
import styles from './dashboard.module.css';

// How often we sample household power and persist it to localStorage.
const SAMPLE_INTERVAL_MS = 1000;

type EnergyTabProps = {
  houseId: string;
};

export function EnergyTab({ houseId }: EnergyTabProps) {
  const [data, setData] = useState<HouseholdEnergy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Sample the household's live power once per second, refresh the on-screen
  // stats, and persist each reading so the history charts have data to show.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function sample(initial: boolean) {
      try {
        const energy = await backendApi.getHouseholdEnergy(houseId);
        if (cancelled) return;
        setData(energy);
        setError(null);
        localData.recordEnergySample(houseId, {
          watts: energy.total_estimated_watts,
          activeDevices: energy.active_devices,
          totalDevices: energy.total_devices,
        });
      } catch (err) {
        // Only surface the error if we have nothing to show yet; transient
        // failures during polling shouldn't blank out the tab.
        if (!cancelled && initial) {
          setError(err instanceof Error ? err.message : 'Failed to load energy data');
        }
      } finally {
        if (!cancelled && initial) setLoading(false);
      }
    }

    void sample(true);
    const timer = window.setInterval(() => void sample(false), SAMPLE_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [houseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{error}</p>;
  }

  if (!data) return null;

  const sorted = [...data.devices].sort((a, b) => b.estimated_watts - a.estimated_watts);

  return (
    <>
      {/* Stats Row */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className={`${styles.statCard} relative p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
              <svg className="h-5 w-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Power</p>
              <p className="text-2xl font-black text-white">
                {data.total_estimated_watts >= 1000
                  ? `${(data.total_estimated_watts / 1000).toFixed(1)} kW`
                  : `${data.total_estimated_watts} W`}
              </p>
            </div>
          </div>
        </article>

        <article className={`${styles.statCard} relative p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Devices</p>
              <p className="text-2xl font-black text-white">
                {data.active_devices} <span className="text-sm font-semibold text-slate-400">/ {data.total_devices}</span>
              </p>
            </div>
          </div>
        </article>

        <article className={`${styles.statCard} relative p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg / Device</p>
              <p className="text-2xl font-black text-white">
                {data.active_devices > 0
                  ? `${Math.round(data.total_estimated_watts / data.active_devices)} W`
                  : '0 W'}
              </p>
            </div>
          </div>
        </article>
      </section>

      {/* Device Breakdown Chart */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <p className={styles.sectionTitle}>Power by Device</p>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/60 px-3 py-1.5 text-sm text-emerald-300 transition hover:bg-slate-700/60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Energy History
          </button>
        </div>
        <div className="mt-3">
          {data.devices.length > 0 ? (
            <ul className="divide-y divide-white/5 rounded-xl border border-white/10 bg-slate-900/40">
              {sorted.map((device: DeviceEnergy) => (
                <li key={device.device_id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 rounded-full ${device.is_on ? 'bg-emerald-400' : 'bg-slate-600'}`}
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{device.device_name}</p>
                      <p className="text-[11px] text-slate-400">{DEVICE_TYPE_LABELS[device.device_type] ?? 'Unknown'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white">{Math.round(device.estimated_watts).toLocaleString()} W</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
              No devices in this house yet.
            </p>
          )}
        </div>
      </section>

      {/* History Modal */}
      {showHistory && (
        <EnergyHistoryModal
          houseId={houseId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
}

// ─── Bar Chart ────────────────────────────────────

type Bar = { label: string; value: number; tooltip?: string; on?: boolean };

function formatValue(value: number, unit: string) {
  if (unit === 'W') return Math.round(value).toLocaleString();
  return value < 1 ? value.toFixed(3) : value.toFixed(2);
}

// ─── Energy History Modal ─────────────────────────

type TimeRange = { label: string; hours: number; showAvg: boolean };

const TIME_RANGES: TimeRange[] = [
  { label: 'Today', hours: 24, showAvg: false },
  { label: 'Last Week', hours: 168, showAvg: true },
  { label: 'Last Month', hours: 720, showAvg: true },
  { label: 'Last Year', hours: 8760, showAvg: true },
];

// Each history point holds the household's instantaneous power (W) for an hour
// slot, so energy for that hour ≈ watts / 1000 kWh. Buckets sum those into
// kWh consumed per hour / day / month depending on the selected range.
function buildSeries(history: EnergyHistoryPoint[], hours: number): Bar[] {
  if (hours <= 24) {
    return [...history]
      .sort((a, b) => +new Date(a.hour_slot) - +new Date(b.hour_slot))
      .map((point) => {
        const d = new Date(point.hour_slot);
        return {
          label: d.toLocaleTimeString('en-US', { hour: 'numeric' }),
          value: (point.total_estimated_watts ?? 0) / 1000,
          tooltip: d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        };
      });
  }

  const monthly = hours > 24 * 35;
  const buckets = new Map<string, { time: number; kwh: number }>();
  for (const point of history) {
    const d = new Date(point.hour_slot);
    const key = monthly
      ? `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      : d.toISOString().split('T')[0];
    const kwh = (point.total_estimated_watts ?? 0) / 1000;
    const existing = buckets.get(key);
    if (existing) existing.kwh += kwh;
    else buckets.set(key, { time: +d, kwh });
  }

  return [...buckets.values()]
    .sort((a, b) => a.time - b.time)
    .map(({ time, kwh }) => {
      const d = new Date(time);
      return {
        label: monthly
          ? d.toLocaleDateString('en-US', { month: 'short' })
          : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        value: kwh,
        tooltip: monthly
          ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      };
    });
}

function EnergyHistoryModal({ houseId, onClose }: { houseId: string; onClose: () => void }) {
  const [history, setHistory] = useState<EnergyHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(TIME_RANGES[0]);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      // History is built from the per-second samples recorded locally while the
      // energy tab is open, rather than the (currently empty) backend endpoint.
      setHistory(localData.getEnergyHistory(houseId, timeRange.hours));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [houseId, timeRange]);

  const totalKwh = history?.summary?.total_kwh ?? 0;
  const estimatedCost = history?.summary?.estimated_cost ?? 0;
  const ratePerKwh = history?.summary?.rate_per_kwh ?? 0.22;
  const currency = history?.summary?.currency ?? 'USD';

  // Unique dates from history for the day picker
  const availableDates = useMemo(
    () =>
      history
        ? [...new Set(history.history.map((p) => new Date(p.hour_slot).toISOString().split('T')[0]))].sort().reverse()
        : [],
    [history],
  );

  // The chart shows hourly consumption for the picked day, otherwise the
  // aggregated consumption across the whole selected range.
  const chart = useMemo(() => {
    if (!history) return { bars: [] as Bar[], title: '' };
    if (selectedDate) {
      const dayPoints = history.history.filter(
        (p) => new Date(p.hour_slot).toISOString().split('T')[0] === selectedDate,
      );
      return {
        bars: buildSeries(dayPoints, 24),
        title: `Hourly Consumption — ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}`,
      };
    }
    return { bars: buildSeries(history.history, timeRange.hours), title: `${timeRange.label} Consumption` };
  }, [history, selectedDate, timeRange]);

  const daysInRange = timeRange.hours / 24;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Energy History</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => {
                setTimeRange(range);
                setSelectedDate('');
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                timeRange.label === range.label
                  ? 'bg-emerald-500 text-white'
                  : 'border border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Cost Summary */}
        {history && history.summary && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {timeRange.showAvg ? `Avg kWh / Day` : 'Total kWh'}
              </p>
              <p className="text-xl font-black text-white">
                {timeRange.showAvg
                  ? (totalKwh / daysInRange).toFixed(3)
                  : totalKwh.toFixed(3)} kWh
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {timeRange.showAvg ? `Avg Cost / Day` : 'Estimated Cost'}
              </p>
              <p className="text-xl font-black text-white">
                {currency} {timeRange.showAvg
                  ? (estimatedCost / daysInRange).toFixed(2)
                  : estimatedCost.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rate / kWh</p>
              <p className="text-xl font-black text-white">{currency} {ratePerKwh.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Day Picker */}
        {!loading && !error && availableDates.length > 0 && (
          <div className="mt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Drill into a Day</label>
            <select
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              <option value="">Whole range</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Consumption Chart */}
        {!loading && !error && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              {chart.title} <span className="text-slate-500">(kWh)</span>
            </p>
            {chart.bars.length > 0 ? (
              <ul className="max-h-64 divide-y divide-white/5 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/40">
                {chart.bars.map((bar, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-slate-300" title={bar.tooltip}>{bar.tooltip ?? bar.label}</span>
                    <span className="text-sm font-bold text-white">{formatValue(bar.value, 'kWh')} kWh</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
                No consumption data for this period.
              </p>
            )}
          </div>
        )}

        {/* Loading/Error States */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          </div>
        )}
        {error && (
          <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{error}</p>
        )}
      </div>
    </div>
  );
}
