'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { adminJobPostingsApi, JobPosting } from '@/lib/api-client';

function ModerationQueueContent() {
  const { accessToken } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchPending = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      // Moderasyon kuyruğu düşük hacimli olduğu için tüm ilanları çekip
      // PENDING_REVIEW olanları burada filtreliyoruz; ayrı bir status
      // parametresi backend'de henüz açılmadı.
      const result = await adminJobPostingsApi.list({ pageSize: 50 }, accessToken);
      setJobs(result.items.filter((job) => job.status === 'PENDING_REVIEW'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleApprove = async (id: string) => {
    if (!accessToken) return;
    setActioningId(id);
    try {
      await adminJobPostingsApi.approve(id, accessToken);
      setJobs((prev) => prev.filter((job) => job.id !== id));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!accessToken) return;
    if (!window.confirm('Bu ilanı reddetmek (arşivlemek) istediğinize emin misiniz?')) return;
    setActioningId(id);
    try {
      await adminJobPostingsApi.archive(id, accessToken);
      setJobs((prev) => prev.filter((job) => job.id !== id));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Moderasyon Kuyruğu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Otomatik taramada düşük güvenilirlikle çıkarılan ilanlar burada incelemenizi bekliyor.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-600" size={24} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">İncelemeyi bekleyen ilan bulunmuyor. 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">{job.institutionName}</h2>
                    <Badge variant="warning">İncelemede</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{job.positionTitle}</p>
                  {job.description && (
                    <p className="mt-2 line-clamp-2 max-w-2xl text-xs text-slate-500">
                      {job.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/admin/ilanlar/${job.id}`}>
                    <Button variant="outline" className="px-3 py-1.5 text-xs">
                      Detay / Düzenle
                    </Button>
                  </Link>
                  <Button
                    className="px-3 py-1.5 text-xs"
                    onClick={() => handleApprove(job.id)}
                    isLoading={actioningId === job.id}
                  >
                    Onayla
                  </Button>
                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-xs text-danger-600 hover:bg-danger-50"
                    onClick={() => handleReject(job.id)}
                    isLoading={actioningId === job.id}
                  >
                    Reddet
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModerationQueuePage() {
  return (
    <AdminShell allowedRoles={['ADMIN', 'MODERATOR']}>
      <ModerationQueueContent />
    </AdminShell>
  );
}
