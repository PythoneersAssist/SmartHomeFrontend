import type { AuthSession, EnergyHistoryResponse } from '../types/domain';

const SESSION_KEY = 'smarthome_session';
const FAVORITES_KEY = 'smarthome_device_favorites';
const ENERGY_KEY = 'smarthome_energy_history';

// How many hourly buckets to keep per house (one year).
const MAX_ENERGY_HOURS = 8760;
const DEFAULT_RATE_PER_KWH = 0.22;
const DEFAULT_CURRENCY = 'USD';

type HouseFavoritesMap = Record<string, string[]>;

// Per-second samples are averaged into the hour they fall in, so localStorage
// only ever holds one bucket per hour regardless of sampling frequency.
type EnergyBucket = {
  hour_slot: string; // ISO timestamp at the start of the hour
  watt_sum: number; // sum of every sampled wattage in this hour
  sample_count: number; // number of samples taken this hour
  active_devices: number; // last observed value
  total_devices: number; // last observed value
};

type EnergyHistoryMap = Record<string, EnergyBucket[]>;

function hourSlot(date: Date): string {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const localData = {
  getSession: () => safeRead<AuthSession | null>(SESSION_KEY, null),
  saveSession: (session: AuthSession | null) => {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    safeWrite(SESSION_KEY, session);
  },
  getFavoriteDeviceIds: (houseId: string) => {
    if (!houseId) {
      return [];
    }

    const map = safeRead<HouseFavoritesMap>(FAVORITES_KEY, {});
    const ids = map[houseId] ?? [];
    return Array.from(new Set(ids.filter((id) => typeof id === 'string' && id.length > 0)));
  },
  saveFavoriteDeviceIds: (houseId: string, deviceIds: string[]) => {
    if (!houseId) {
      return;
    }

    const map = safeRead<HouseFavoritesMap>(FAVORITES_KEY, {});
    const uniqueIds = Array.from(new Set(deviceIds.filter((id) => id.length > 0)));

    if (uniqueIds.length === 0) {
      delete map[houseId];
      if (Object.keys(map).length === 0) {
        localStorage.removeItem(FAVORITES_KEY);
        return;
      }
      safeWrite(FAVORITES_KEY, map);
      return;
    }

    map[houseId] = uniqueIds;
    safeWrite(FAVORITES_KEY, map);
  },

  // Record one instantaneous energy reading for a house. Called once per second
  // while the energy tab is open; readings are folded into the current hour's
  // bucket so storage stays bounded.
  recordEnergySample: (
    houseId: string,
    sample: { watts: number; activeDevices: number; totalDevices: number },
  ) => {
    if (!houseId) {
      return;
    }

    const map = safeRead<EnergyHistoryMap>(ENERGY_KEY, {});
    const buckets = map[houseId] ?? [];
    const slot = hourSlot(new Date());
    const last = buckets[buckets.length - 1];

    if (last && last.hour_slot === slot) {
      last.watt_sum += sample.watts;
      last.sample_count += 1;
      last.active_devices = sample.activeDevices;
      last.total_devices = sample.totalDevices;
    } else {
      buckets.push({
        hour_slot: slot,
        watt_sum: sample.watts,
        sample_count: 1,
        active_devices: sample.activeDevices,
        total_devices: sample.totalDevices,
      });
    }

    // Keep only the most recent year of hourly buckets.
    if (buckets.length > MAX_ENERGY_HOURS) {
      buckets.splice(0, buckets.length - MAX_ENERGY_HOURS);
    }

    map[houseId] = buckets;
    try {
      safeWrite(ENERGY_KEY, map);
    } catch {
      // localStorage full — drop the oldest half and retry once.
      buckets.splice(0, Math.floor(buckets.length / 2));
      map[houseId] = buckets;
      try {
        safeWrite(ENERGY_KEY, map);
      } catch {
        // Give up silently; sampling will resume next tick.
      }
    }
  },

  // Build an EnergyHistoryResponse from the locally recorded samples, matching
  // the shape the charts already consume from the backend.
  getEnergyHistory: (houseId: string, hours = 24): EnergyHistoryResponse => {
    const empty: EnergyHistoryResponse = { house_id: houseId, hours, history: [] };
    if (!houseId) {
      return empty;
    }

    const map = safeRead<EnergyHistoryMap>(ENERGY_KEY, {});
    const buckets = map[houseId] ?? [];
    const cutoff = Date.now() - hours * 60 * 60 * 1000;

    const recent = buckets.filter((b) => +new Date(b.hour_slot) >= cutoff);
    const history = recent.map((b) => ({
      hour_slot: b.hour_slot,
      total_estimated_watts: b.sample_count > 0 ? b.watt_sum / b.sample_count : 0,
      active_devices: b.active_devices,
      total_devices: b.total_devices,
    }));

    // Each hourly bucket holds average watts, so its energy ≈ avgW / 1000 kWh.
    const totalKwh = history.reduce((sum, p) => sum + (p.total_estimated_watts ?? 0) / 1000, 0);

    return {
      house_id: houseId,
      hours,
      history,
      summary: {
        total_kwh: totalKwh,
        estimated_cost: totalKwh * DEFAULT_RATE_PER_KWH,
        currency: DEFAULT_CURRENCY,
        rate_per_kwh: DEFAULT_RATE_PER_KWH,
      },
    };
  },
};
