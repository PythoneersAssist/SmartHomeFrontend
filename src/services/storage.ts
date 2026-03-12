import type { AuthSession } from '../types/domain';

const SESSION_KEY = 'smarthome_session';

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
};
