'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarClock, Check, CheckCheck, Loader2, Sparkles } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/dashboard/pagination';
import { useAuth } from '@/lib/auth-context';
import { useNotificationCount } from '@/lib/notification-count-context';
import { notificationsApi, NotificationRecord, NotificationType } from '@/lib/api-client';

const PAGE_SIZE = 10;

const TYPE_ICON: Record<NotificationType, typeof Sparkles> = {
  NEW_MATCH: Sparkles,
  DEADLINE_SOON: CalendarClock,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${Math.max(diffMin, 1)} dakika önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} saat önce`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} gün önce`;
}

function NotificationsContent() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const { decrementUnreadCount, clearUnreadCount } = useNotificationCount();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async (targetPage: number) => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await notificationsApi.list({ page: targetPage, pageSize: PAGE_SIZE }, accessToken);
      setNotifications(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setUnreadCount(result.unreadCount);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const markAsRead = (notificationId: string) => {
    if (!accessToken) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    decrementUnreadCount();
    notificationsApi.markRead(notificationId, accessToken).catch(() => undefined);
  };

  const handleNotificationClick = (notification: NotificationRecord) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.jobPostingId) {
      router.push(`/dashboard/ilanlar/${notification.jobPostingId}`);
    }
  };

  const handleMarkReadClick = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleMarkAllRead = async () => {
    if (!accessToken || unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    clearUnreadCount();
    await notificationsApi.markAllRead(accessToken).catch(() => undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Bell className="text-brand-600" size={22} />
            Bildirimlerim
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Uygun yeni ilanlar ve yaklaşan son başvuru tarihleri hakkında bildirimleriniz.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <CheckCheck size={16} />
            Tümünü Okundu İşaretle ({unreadCount})
          </button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand-600" size={24} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <Bell size={26} />
            </span>
            <p className="text-sm font-medium text-slate-700">Henüz bildiriminiz yok.</p>
            <p className="max-w-sm text-sm text-slate-500">
              Size uygun yeni bir ilan bulunduğunda veya bir ilanın son başvuru tarihi
              yaklaştığında burada bildirim göreceksiniz.
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = TYPE_ICON[notification.type];
            return (
              <div
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
                className="flex w-full cursor-pointer items-start gap-3 border-b border-slate-100 py-4 text-left last:border-0 last:pb-0"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    notification.type === 'DEADLINE_SOON'
                      ? 'bg-warning-100 text-warning-600'
                      : 'bg-brand-50 text-brand-600'
                  }`}
                >
                  <Icon size={18} />
                </span>
                <div className="flex-1">
                  <p
                    className={`text-sm ${notification.isRead ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}
                  >
                    {notification.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{notification.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(notification.createdAt)}</p>
                </div>
                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={(e) => handleMarkReadClick(e, notification.id)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Check size={13} />
                    Okundu İşaretle
                  </button>
                )}
              </div>
            );
          })
        )}
      </Card>

      {notifications.length > 0 && (
        <>
          <p className="text-center text-xs text-slate-400">Toplam {totalCount} bildirim</p>
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchNotifications(p)} />
        </>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <DashboardShell>
      <NotificationsContent />
    </DashboardShell>
  );
}
