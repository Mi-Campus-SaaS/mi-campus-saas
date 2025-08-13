import React, { useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '../api/client';
import { AuthContext, type User } from './context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      const { token: t, user: u } = JSON.parse(saved);
      setUser(u);
      setToken(t);
      setAuthToken(t);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    setUser(res.data.user);
    setToken(res.data.access_token);
    setAuthToken(res.data.access_token);
    localStorage.setItem('auth', JSON.stringify(res.data));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(undefined);
    localStorage.removeItem('auth');
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

