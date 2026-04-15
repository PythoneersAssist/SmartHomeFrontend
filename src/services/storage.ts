import type { AuthSession } from '../types/domain';

const SESSION_KEY = 'smarthome_session';
const FAVORITES_KEY = 'smarthome_device_favorites';

type HouseFavoritesMap = Record<string, string[]>;

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
};
