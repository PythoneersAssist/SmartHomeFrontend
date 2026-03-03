import { useState, type ReactNode } from 'react';
import Cookies from 'js-cookie';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    Cookies.get('token') || null
  );

  const setToken = (newToken: string | null) => {
    if (newToken) {
      Cookies.set('token', newToken, { expires: 7 });
    } else {
      Cookies.remove('token');
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
