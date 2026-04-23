import { useEffect, useState } from 'react';
import { backendApi } from '../../services/api';
import type { DeviceEnergy, EnergyHistoryPoint, EnergyHistoryResponse, HouseholdEnergy } from '../../types/domain';
import { DEVICE_TYPE_LABELS } from '../../types/domain';
import styles from './dashboard.module.css';

type EnergyTabProps = {
  houseId: string;
};

export function EnergyTab({ houseId }: EnergyTabProps) {
  const [data, setData] = useState<HouseholdEnergy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const energy = await backendApi.getHouseholdEnergy(houseId);
        setData(energy);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load energy data');
      } finally {
        setLoading(false);
      }
    }
    void load();
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

  const maxWatts = Math.max(...data.devices.map((d) => d.estimated_watts), 1);
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

      {/* Device Breakdown */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <p className={styles.sectionTitle}>Device Power Breakdown</p>
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
        <div className="mt-3 space-y-2">
          {sorted.map((device: DeviceEnergy) => (
            <div
              className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3"
              key={device.device_id}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${device.is_on ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <div>
                    <p className="text-sm font-bold text-white">{device.device_name}</p>
                    <p className="text-xs text-slate-400">{DEVICE_TYPE_LABELS[device.device_type] ?? 'Unknown'}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${device.is_on ? 'text-amber-300' : 'text-slate-500'}`}>
                  {device.estimated_watts} W
                </p>
              </div>
              {/* Bar */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700/50">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(device.estimated_watts / maxWatts) * 100}%`,
                    background: device.is_on
                      ? 'linear-gradient(90deg, #10b981, #f59e0b)'
                      : 'rgb(71, 85, 105)',
                  }}
                />
              </div>
            </div>
          ))}
          {data.devices.length === 0 && (
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

// ─── Energy History Modal ─────────────────────────

type TimeRange = { label: string; hours: number; showAvg: boolean };

const TIME_RANGES: TimeRange[] = [
  { label: 'Today', hours: 24, showAvg: false },
  { label: 'Last Week', hours: 168, showAvg: true },
  { label: 'Last Month', hours: 720, showAvg: true },
  { label: 'Last Year', hours: 8760, showAvg: true },
];

function EnergyHistoryModal({ houseId, onClose }: { houseId: string; onClose: () => void }) {
  const [history, setHistory] = useState<EnergyHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(TIME_RANGES[0]);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await backendApi.getHouseholdEnergyHistory(houseId, timeRange.hours);
        setHistory(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [houseId, timeRange]);

  const totalKwh = history?.summary?.total_kwh ?? 0;
  const estimatedCost = history?.summary?.estimated_cost ?? 0;
  const ratePerKwh = history?.summary?.rate_per_kwh ?? 0.22;
  const currency = history?.summary?.currency ?? 'USD';

  // Filter history for selected date (show hourly data for that day)
  const selectedDayHistory = selectedDate && history
    ? history.history.filter((point) => {
        const pointDate = new Date(point.hour_slot).toISOString().split('T')[0];
        return pointDate === selectedDate;
      })
    : [];

  // Get unique dates from history for the day picker
  const availableDates = history
    ? [...new Set(history.history.map((point) => new Date(point.hour_slot).toISOString().split('T')[0]))].sort().reverse()
    : [];

  const daysInRange = timeRange.hours / 24;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
        <div className="mt-4 flex gap-2">
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
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Day for Hourly View</label>
            <select
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              <option value="">-- Select a day --</option>
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

        {/* Hourly Data for Selected Day */}
        {selectedDate && selectedDayHistory.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Hourly Consumption - {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {selectedDayHistory.map((point: EnergyHistoryPoint, index: number) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-800/30 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="flex-1 text-xs text-slate-400">
                    {new Date(point.hour_slot).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {point.total_estimated_watts ?? 0} W
                  </span>
                </div>
              ))}
            </div>
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
