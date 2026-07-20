'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { notificationsApi } from './api-client';

interface NotificationCountContextValue {
  unreadCount: number;
  refetchUnreadCount: () => void;
  decrementUnreadCount: (by?: number) => void;
  clearUnreadCount: () => void;
}

const NotificationCountContext = createContext<NotificationCountContextValue | undefined>(
  undefined,
);

export function NotificationCountProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refetchUnreadCount = useCallback(() => {
    if (!accessToken) return;
    notificationsApi
      .unreadCount(accessToken)
      .then((result) => setUnreadCount(result.count))
      .catch(() => undefined);
  }, [accessToken]);

  useEffect(() => {
    refetchUnreadCount();
  }, [refetchUnreadCount]);

  const decrementUnreadCount = useCallback((by = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - by));
  }, []);

  const clearUnreadCount = useCallback(() => setUnreadCount(0), []);

  return (
    <NotificationCountContext.Provider
      value={{ unreadCount, refetchUnreadCount, decrementUnreadCount, clearUnreadCount }}
    >
      {children}
    </NotificationCountContext.Provider>
  );
}

export function useNotificationCount(): NotificationCountContextValue {
  const context = useContext(NotificationCountContext);
  if (!context) {
    throw new Error('useNotificationCount, NotificationCountProvider içinde kullanılmalıdır');
  }
  return context;
}
