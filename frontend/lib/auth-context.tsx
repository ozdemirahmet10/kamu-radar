'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, LoginPayload, RegisterPayload, UserResponse } from './api-client';

const ACCESS_TOKEN_KEY = 'kamu_radar_access_token';
const REFRESH_TOKEN_KEY = 'kamu_radar_refresh_token';
const VIEW_MODE_KEY = 'kamu_radar_view_mode';

export type ViewMode = 'admin' | 'user';

interface AuthContextValue {
  user: UserResponse | null;
  accessToken: string | null;
  isLoading: boolean;
  viewMode: ViewMode;
  viewAsUser: () => void;
  viewAsAdmin: () => void;
  login: (payload: LoginPayload) => Promise<UserResponse>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewModeState] = useState<ViewMode>('admin');

  useEffect(() => {
    const storedAccessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    const storedViewMode = window.localStorage.getItem(VIEW_MODE_KEY);
    if (storedViewMode === 'user' || storedViewMode === 'admin') {
      setViewModeState(storedViewMode);
    }

    if (!storedAccessToken || !storedRefreshToken) {
      setIsLoading(false);
      return;
    }

    authApi
      .me(storedAccessToken)
      .then((currentUser) => {
        setAccessToken(storedAccessToken);
        setUser(currentUser);
      })
      .catch(() => {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    window.localStorage.setItem(VIEW_MODE_KEY, mode);
  }, []);

  const viewAsUser = useCallback(() => setViewMode('user'), [setViewMode]);
  const viewAsAdmin = useCallback(() => setViewMode('admin'), [setViewMode]);

  const login = useCallback(async (payload: LoginPayload): Promise<UserResponse> => {
    const tokens = await authApi.login(payload);
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    const currentUser = await authApi.me(tokens.accessToken);
    setAccessToken(tokens.accessToken);
    setUser(currentUser);
    // Her girişte admin hesabı varsayılan olarak yönetim moduyla başlar.
    window.localStorage.setItem(VIEW_MODE_KEY, 'admin');
    setViewModeState('admin');
    return currentUser;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authApi.register(payload);
  }, []);

  const logout = useCallback(async () => {
    if (accessToken) {
      await authApi.logout(accessToken).catch(() => undefined);
    }
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(VIEW_MODE_KEY);
    setAccessToken(null);
    setUser(null);
  }, [accessToken]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      viewMode,
      viewAsUser,
      viewAsAdmin,
      login,
      register,
      logout,
    }),
    [user, accessToken, isLoading, viewMode, viewAsUser, viewAsAdmin, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalıdır');
  }
  return context;
}
