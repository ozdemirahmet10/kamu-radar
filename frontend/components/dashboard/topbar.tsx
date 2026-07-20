'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CalendarClock, ChevronDown, Loader2, Search, Sparkles, Sun } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { useNotificationCount } from '@/lib/notification-count-context';
import { notificationsApi, NotificationRecord } from '@/lib/api-client';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${Math.max(diffMin, 1)} dk önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa önce`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} gün önce`;
}

export function Topbar() {
  const { user, logout, accessToken } = useAuth();
  const router = useRouter();
  const { unreadCount: unreadNotificationCount, decrementUnreadCount } = useNotificationCount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [themeNotice, setThemeNotice] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isNotifLoading, setIsNotifLoading] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationRecord[]>([]);

  if (!user) return null;

  const handleToggleNotifications = async () => {
    const next = !isNotifOpen;
    setIsNotifOpen(next);
    if (next && accessToken) {
      setIsNotifLoading(true);
      try {
        const result = await notificationsApi.list({ page: 1, pageSize: 5 }, accessToken);
        setRecentNotifications(result.items);
      } finally {
        setIsNotifLoading(false);
      }
    }
  };

  const handleNotificationItemClick = async (notification: NotificationRecord) => {
    setIsNotifOpen(false);
    if (!notification.isRead && accessToken) {
      decrementUnreadCount();
      notificationsApi.markRead(notification.id, accessToken).catch(() => undefined);
    }
    if (notification.jobPostingId) {
      router.push(`/dashboard/ilanlar/${notification.jobPostingId}`);
    } else {
      router.push('/dashboard/bildirimler');
    }
  };

  return (
    <header className="flex items-center gap-4 border-b border-slate-100 bg-white px-8 py-4">
      <div className="relative w-full max-w-xl">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Kurum, şehir, kadro veya ilan ara..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100"
          >
            <Bell size={18} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-600 text-[10px] font-semibold text-white">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border border-slate-100 bg-white p-1.5 shadow-card">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">Bildirimler</p>
              </div>
              {isNotifLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-brand-600" size={20} />
                </div>
              ) : recentNotifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-slate-500">
                  Henüz bildiriminiz yok.
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {recentNotifications.map((notification) => {
                    const Icon = notification.type === 'DEADLINE_SOON' ? CalendarClock : Sparkles;
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationItemClick(notification)}
                        className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                      >
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            notification.type === 'DEADLINE_SOON'
                              ? 'bg-warning-100 text-warning-600'
                              : 'bg-brand-50 text-brand-600'
                          }`}
                        >
                          <Icon size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-xs ${
                              notification.isRead ? 'text-slate-600' : 'font-semibold text-slate-900'
                            }`}
                          >
                            {notification.message}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-slate-400">
                            {timeAgo(notification.createdAt)}
                          </span>
                        </span>
                        {!notification.isRead && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <Link
                href="/dashboard/bildirimler"
                onClick={() => setIsNotifOpen(false)}
                className="mt-1 block rounded-lg px-3 py-2 text-center text-xs font-semibold text-brand-600 hover:bg-brand-50"
              >
                Tümünü Gör
              </Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setThemeNotice((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100"
          >
            <Sun size={18} />
          </button>
          {themeNotice && (
            <div className="absolute right-0 top-12 w-44 rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-500 shadow-card">
              Karanlık tema yakında eklenecek.
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-50"
          >
            <Avatar fullName={user.fullName} size="sm" />
            <span className="text-left">
              <span className="block text-sm font-semibold leading-tight text-slate-900">
                {user.fullName}
              </span>
            </span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-card">
              <Link
                href="/dashboard/profil"
                className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Profilim
              </Link>
              <Link
                href="/dashboard/ayarlar"
                className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Ayarlar
              </Link>
              <button
                onClick={() => logout()}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50"
              >
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
