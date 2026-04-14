import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiRequest } from '@/lib/api';

const TOKEN_KEY = 'hc_token';

export type User = {
  user_id: number;
  email: string;
  user_type: 'patient' | 'doctor' | 'nurse' | 'admin' | 'pharmacist' | 'receptionist' | string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    const me = await apiRequest<User>('/auth/me', { query: { token } });
    setUser(me);
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) setToken(stored);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!token) {
        setUser(null);
        return;
      }
      try {
        await refreshMe();
      } catch {
        // Token invalid/expired
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    })();
  }, [token, refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const resp = await apiRequest<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await AsyncStorage.setItem(TOKEN_KEY, resp.access_token);
    setToken(resp.access_token);
    await refreshMe();
  }, [refreshMe]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(() => ({
    token,
    user,
    loading,
    error,
    login,
    logout,
    refreshMe,
  }), [token, user, loading, error, login, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

