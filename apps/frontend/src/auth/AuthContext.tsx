import React, { useEffect, useMemo, useState } from 'react';
import { api, setAuthToken, getStoredAuth, setAuthTokens, clearStoredAuth, setLogoutHandler } from '../api/client';
import { AuthContext, type User } from './context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const saved = getStoredAuth();
  const [user, setUser] = useState<User | null>((saved?.user as User) ?? null);
  const [token, setToken] = useState<string | null>(saved?.access_token ?? null);

  useEffect(() => {
    if (saved?.access_token) {
      setAuthToken(saved.access_token);
    }
    const doLocalLogout = () => {
      setUser(null);
      setToken(null);
    };
    setLogoutHandler(doLocalLogout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post<
      { access_token: string; refresh_token: string; user: User } | { requires2fa: true; user: User }
    >('/auth/login', {
      username,
      password,
    });

    if ('requires2fa' in res.data && res.data.requires2fa) {
      return { requires2fa: true, user: res.data.user };
    }

    const data = res.data as { access_token: string; refresh_token: string; user: User };
    setUser(data.user);
    setToken(data.access_token);
    setAuthTokens({ accessToken: data.access_token, refreshToken: data.refresh_token, user: data.user });
  };

  const verify2fa = async (username: string, password: string, code: string) => {
    const res = await api.post<{ access_token: string; refresh_token: string; user: User }>('/auth/verify-2fa', {
      username,
      password,
      code,
    });
    setUser(res.data.user);
    setToken(res.data.access_token);
    setAuthTokens({ accessToken: res.data.access_token, refreshToken: res.data.refresh_token, user: res.data.user });
  };

  const logout = async () => {
    const saved = getStoredAuth();
    try {
      if (saved?.refresh_token) {
        await api.post('/auth/logout', { refresh_token: saved.refresh_token });
      }
    } catch {
      // ignore network/logout errors
    }
    clearStoredAuth();
    setUser(null);
    setToken(null);
  };

  const value = useMemo(() => ({ user, token, login, verify2fa, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
