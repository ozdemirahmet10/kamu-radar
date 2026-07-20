'use client';

import { useEffect, useState } from 'react';
import { Loader2, Users, ClipboardList, ShieldAlert, Radar, UserX, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { adminDashboardApi, AdminDashboardStats } from '@/lib/api-client';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  PUBLISHED: 'Yayında',
  EXPIRED: 'Süresi Doldu',
  ARCHIVED: 'Arşivlendi',
  PENDING_REVIEW: 'İncelemede',
};

function AdminDashboardContent() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    adminDashboardApi
      .stats(accessToken)
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, [accessToken]);

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
          </div>
        </Card>
      </div>
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
