import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { backendApi } from '../services/api';
import { localData } from '../services/storage';
import type { SmartUser } from '../types/domain';

type AuthContextType = {
  user: SmartUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SmartUser | null>(() => {
    const session = localData.getSession();
    return session?.user ?? null;
  });
  const [loading, setLoading] = useState(() => {
    return localData.getSession() !== null;
  });

  useEffect(() => {
    const session = localData.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    backendApi
      .getMe()
      .then((data) => {
        setUser({ id: data.id, username: data.username, email: data.email });
      })
      .catch(() => {
        localData.saveSession(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokenResp = await backendApi.login(username, password);
    // Store token first so getMe can use it
    localData.saveSession({ accessToken: tokenResp.access_token, user: { id: '', username: '', email: '' } });

    const userData = await backendApi.getMe();
    const smartUser: SmartUser = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
    };
    localData.saveSession({ accessToken: tokenResp.access_token, user: smartUser });
    setUser(smartUser);
  }, []);

  const register = useCallback(async (payload: { username: string; email: string; password: string }) => {
    await backendApi.register(payload);
    // Auto-login after registration (backend accepts username or email)
    await login(payload.username, payload.password);
  }, [login]);

  const logout = useCallback(() => {
    localData.saveSession(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
