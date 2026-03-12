import { useEffect, useState } from 'react';
import { backendApi } from '../../services/api';
import type { DeviceEnergy, HouseholdEnergy } from '../../types/domain';
import { DEVICE_TYPE_LABELS } from '../../types/domain';
import styles from './dashboard.module.css';

type EnergyTabProps = {
  houseId: string;
};

export function EnergyTab({ houseId }: EnergyTabProps) {
  const [data, setData] = useState<HouseholdEnergy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
              <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
        <p className={styles.sectionTitle}>Device Power Breakdown</p>
        <div className="mt-3 space-y-2">
          {sorted.map((device: DeviceEnergy) => (
            <div
              className="rounded-xl border border-cyan-200/10 bg-slate-900/40 px-4 py-3"
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
                      ? 'linear-gradient(90deg, #06b6d4, #f59e0b)'
                      : 'rgb(71, 85, 105)',
                  }}
                />
              </div>
            </div>
          ))}
          {data.devices.length === 0 && (
            <p className="rounded-xl border border-dashed border-cyan-500/15 p-8 text-center text-sm text-slate-500">
              No devices in this house yet.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
