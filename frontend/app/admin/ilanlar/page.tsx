'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/dashboard/pagination';
import { useAuth } from '@/lib/auth-context';
import { adminJobPostingsApi, AdminJobPosting } from '@/lib/api-client';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  PUBLISHED: 'Yayında',
  EXPIRED: 'Süresi Doldu',
  ARCHIVED: 'Arşivlendi',
  PENDING_REVIEW: 'İncelemede',
};

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  EXPIRED: 'neutral',
  ARCHIVED: 'danger',
  PENDING_REVIEW: 'warning',
};

function AdminJobPostingsContent() {
  const { accessToken } = useAuth();
  const [jobs, setJobs] = useState<AdminJobPosting[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchJobs = async (targetPage: number) => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await adminJobPostingsApi.list(
        { keyword: keyword || undefined, page: targetPage, pageSize: PAGE_SIZE },
        accessToken,
      );
      setJobs(result.items);
      setPage(result.page);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleArchive = async (id: string) => {
    if (!accessToken) return;
    if (!window.confirm('Bu ilanı arşivlemek istediğinize emin misiniz?')) return;
    setActioningId(id);
    try {
      await adminJobPostingsApi.archive(id, accessToken);
      await fetchJobs(page);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İlan Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Toplam <span className="font-semibold text-slate-900">{totalCount}</span> ilan
          </p>
        </div>
        <Link href="/admin/ilanlar/yeni">
          <Button className="gap-2">
            <Plus size={16} />
            Yeni İlan
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchJobs(1);
          }}
          placeholder="Kurum veya kadro adında ara..."
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <Button variant="outline" onClick={() => fetchJobs(1)}>
          Ara
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-600" size={24} />
          </div>
        ) : jobs.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">Kayıtlı ilan bulunamadı.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Kurum</th>
                <th className="px-4 py-3">Kadro</th>
                <th className="px-4 py-3">Kaynak</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Oluşturulma</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{job.institutionName}</td>
                  <td className="px-4 py-3 text-slate-600">{job.positionTitle}</td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{job.sourceName}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE_VARIANT[job.status] ?? 'neutral'}>
                      {STATUS_LABELS[job.status] ?? job.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(job.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/ilanlar/${job.id}`}>
                        <Button variant="outline" className="px-3 py-1.5 text-xs">
                          Düzenle
                        </Button>
                      </Link>
                      {job.status !== 'ARCHIVED' && (
                        <Button
                          variant="outline"
                          className="px-3 py-1.5 text-xs text-danger-600 hover:bg-danger-50"
                          onClick={() => handleArchive(job.id)}
                          isLoading={actioningId === job.id}
                        >
                          Arşivle
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchJobs(p)} />
    </div>
  );
}

export default function AdminJobPostingsPage() {
  return (
    <AdminShell allowedRoles={['ADMIN', 'MODERATOR']}>
      <AdminJobPostingsContent />
    </AdminShell>
  );
}
