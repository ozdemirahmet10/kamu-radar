'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Users,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
  Radar,
  UserX,
  Trash2,
  DatabaseBackup,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card } from '@/components/ui/card';
import { TrendLineChart } from '@/components/admin/trend-line-chart';
import { useAuth } from '@/lib/auth-context';
import {
  adminDashboardApi,
  adminBackupApi,
  adminMatchFeedbackApi,
  AdminDashboardStats,
  BackupObject,
  MatchFeedbackOverview,
  ApiError,
} from '@/lib/api-client';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  PUBLISHED: 'Yayında',
  EXPIRED: 'Süresi Doldu',
  ARCHIVED: 'Arşivlendi',
  PENDING_REVIEW: 'İncelemede',
};

const MATCH_STATUSES = ['ELIGIBLE', 'PARTIALLY_ELIGIBLE', 'NOT_ELIGIBLE'] as const;

const MATCH_STATUS_META: Record<(typeof MATCH_STATUSES)[number], { label: string; badge: string; dot: string }> = {
  ELIGIBLE: { label: 'Uygun', badge: 'text-success-700', dot: 'bg-success-600' },
  PARTIALLY_ELIGIBLE: { label: 'Kısmen Uygun', badge: 'text-warning-700', dot: 'bg-warning-600' },
  NOT_ELIGIBLE: { label: 'Uygun Değil', badge: 'text-danger-700', dot: 'bg-danger-600' },
};

function AdminDashboardContent() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [backups, setBackups] = useState<BackupObject[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(true);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  const [feedbackOverview, setFeedbackOverview] = useState<MatchFeedbackOverview | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    adminDashboardApi
      .stats(accessToken)
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const loadBackups = () => {
    if (!accessToken) return;
    setIsLoadingBackups(true);
    adminBackupApi
      .list(accessToken)
      .then(setBackups)
      .finally(() => setIsLoadingBackups(false));
  };

  useEffect(loadBackups, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    adminMatchFeedbackApi
      .overview(accessToken)
      .then(setFeedbackOverview)
      .finally(() => setIsLoadingFeedback(false));
  }, [accessToken]);

  const handleTriggerBackup = async () => {
    if (!accessToken || isTriggeringBackup) return;
    setIsTriggeringBackup(true);
    setBackupError(null);
    try {
      await adminBackupApi.trigger(accessToken);
      loadBackups();
    } catch (err) {
      setBackupError(err instanceof ApiError ? err.message : 'Yedekleme başlatılamadı.');
    } finally {
      setIsTriggeringBackup(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Genel Bakış</h1>
        <p className="mt-1 text-sm text-slate-500">Kamu Radar platformunun anlık durumu.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users size={20} />} color="info" value={stats.users.total} label="Toplam Kullanıcı" />
        <StatCard
          icon={<UserX size={20} />}
          color="warning"
          value={stats.users.suspended}
          label="Askıya Alınan Hesap"
        />
        <StatCard
          icon={<Trash2 size={20} />}
          color="danger"
          value={stats.users.deleted}
          label="Silinen Hesap"
        />
        <StatCard
          icon={<ClipboardList size={20} />}
          color="success"
          value={stats.jobPostings.total}
          label="Toplam İlan"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">İlan Durumu Dağılımı</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(stats.jobPostings.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{STATUS_LABELS[status] ?? status}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Radar size={18} />
            Crawler Durumu
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Aktif Kaynak</span>
              <span className="font-semibold text-slate-900">
                {stats.crawler.activeSources} / {stats.crawler.totalSources}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <ShieldAlert size={14} className="text-danger-600" />
                Toplam Hatalı Tarama
              </span>
              <span className="font-semibold text-slate-900">{stats.crawler.failedRuns}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-slate-600">Son 7 Gün Başarı Oranı</span>
              <span className="font-semibold text-slate-900">
                {stats.crawler.last7Days.successRate === null
                  ? 'Tarama yok'
                  : `%${stats.crawler.last7Days.successRate} (${stats.crawler.last7Days.successful}/${stats.crawler.last7Days.total})`}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Eşleşme Dağılımı</h2>
          <p className="mt-1 text-xs text-slate-500">
            Şu ana kadar hesaplanan tüm kullanıcı-ilan eşleşmelerinin uygunluk durumu.
          </p>
          <div className="mt-4 space-y-3">
            {MATCH_STATUSES.map((status) => {
              const meta = MATCH_STATUS_META[status];
              return (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  <span className={`font-semibold ${meta.badge}`}>{stats.matches[status]}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <DatabaseBackup size={18} className="text-brand-600" />
            Veritabanı Yedekleri
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Her gece 04:00&apos;te otomatik alınır, 14 günden eskisi otomatik silinir.
          </p>
          {backupError && <p className="mt-2 text-sm text-danger-600">{backupError}</p>}
          {isLoadingBackups ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-brand-600" size={20} />
            </div>
          ) : backups.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Henüz yedek alınmadı.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {backups.slice(0, 5).map((backup) => (
                <div key={backup.key} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <ShieldCheck size={14} className="text-success-600" />
                    {backup.key.replace('backups/', '')}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(backup.lastModified).toLocaleString('tr-TR')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleTriggerBackup}
            disabled={isTriggeringBackup}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isTriggeringBackup ? <Loader2 className="animate-spin" size={16} /> : <DatabaseBackup size={16} />}
            {isTriggeringBackup ? 'Yedekleniyor...' : 'Şimdi Yedekle'}
          </button>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Yeni Kullanıcılar (Son {stats.trends.days} Gün)</h2>
          <div className="mt-4">
            <TrendLineChart data={stats.trends.newUsers} label="Yeni kullanıcılar" />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900">Yeni İlanlar (Son {stats.trends.days} Gün)</h2>
          <div className="mt-4">
            <TrendLineChart data={stats.trends.newJobPostings} label="Yeni ilanlar" />
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Eşleştirme Geri Bildirimi</h2>
        <p className="mt-1 text-xs text-slate-500">
          Kullanıcıların &quot;bu eşleştirme doğru muydu?&quot; sorusuna verdiği yanıtlar.
        </p>
        {isLoadingFeedback ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-brand-600" size={20} />
          </div>
        ) : !feedbackOverview || feedbackOverview.stats.accurate + feedbackOverview.stats.inaccurate === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Henüz geri bildirim gelmedi.</p>
        ) : (
          <>
            <div className="mt-4 flex gap-6 text-sm">
              <span className="flex items-center gap-1.5 text-success-700">
                <ThumbsUp size={14} /> Doğru: <strong>{feedbackOverview.stats.accurate}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-danger-700">
                <ThumbsDown size={14} /> Yanlış: <strong>{feedbackOverview.stats.inaccurate}</strong>
              </span>
            </div>
            <div className="mt-4 max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {feedbackOverview.recent.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {item.jobPosting
                        ? `${item.jobPosting.institutionName} - ${item.jobPosting.positionTitle}`
                        : 'İlan bulunamadı'}
                    </p>
                    {item.user ? (
                      <Link
                        href={`/admin/kullanicilar/${item.userId}`}
                        className="truncate text-xs text-brand-600 hover:underline"
                      >
                        {item.user.fullName} ({item.user.email})
                      </Link>
                    ) : (
                      <p className="truncate text-xs text-slate-500">Kullanıcı bulunamadı</p>
                    )}
                    {item.reason && <p className="truncate text-xs text-slate-500">{item.reason}</p>}
                  </div>
                  {item.isAccurate ? (
                    <ThumbsUp size={16} className="shrink-0 text-success-600" />
                  ) : (
                    <ThumbsDown size={16} className="shrink-0 text-danger-600" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <AdminDashboardContent />
    </AdminShell>
  );
}
