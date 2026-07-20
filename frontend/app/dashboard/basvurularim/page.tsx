'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/dashboard/pagination';
import { ApplicationStats } from '@/components/applications/application-stats';
import {
  ApplicationFilters,
  ApplicationFilterValues,
  EMPTY_APPLICATION_FILTERS,
} from '@/components/applications/application-filters';
import { ApplicationCard } from '@/components/applications/application-card';
import { ApplicationSummary } from '@/components/applications/application-summary';
import { UpcomingEvents } from '@/components/applications/upcoming-events';
import { useAuth } from '@/lib/auth-context';
import {
  applicationsApi,
  citiesApi,
  ApplicationStats as ApplicationStatsData,
  City,
  JobApplication,
  UpcomingApplicationEvent,
  UpdateApplicationPayload,
} from '@/lib/api-client';

const PAGE_SIZE = 5;

const EMPTY_STATS: ApplicationStatsData = {
  total: 0,
  documentsPending: 0,
  underReview: 0,
  interview: 0,
  accepted: 0,
  rejected: 0,
  successRate: 0,
};

function toApiParams(filters: ApplicationFilterValues) {
  return {
    status: filters.status || undefined,
    keyword: filters.keyword || undefined,
    cityId: filters.cityId || undefined,
    kpssScoreType: filters.kpssScoreType || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };
}

function ApplicationsContent() {
  const { accessToken } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStatsData>(EMPTY_STATS);
  const [upcoming, setUpcoming] = useState<UpcomingApplicationEvent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ApplicationFilterValues>(EMPTY_APPLICATION_FILTERS);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  const cityMap = useMemo(() => new Map(cities.map((city) => [city.id, city])), [cities]);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => undefined);
  }, []);

  const fetchApplications = async (
    targetPage: number,
    targetFilters: ApplicationFilterValues,
    targetSort: 'newest' | 'oldest',
  ) => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await applicationsApi.list(
        { ...toApiParams(targetFilters), sort: targetSort, page: targetPage, pageSize: PAGE_SIZE },
        accessToken,
      );
      setApplications(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setStats(result.stats);
      setUpcoming(result.upcoming);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchApplications(1, filters, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleUpdate = async (jobPostingId: string, payload: UpdateApplicationPayload) => {
    if (!accessToken) return;
    await applicationsApi.update(jobPostingId, payload, accessToken);
    fetchApplications(page, filters, sort);
  };

  const handleRemove = async (jobPostingId: string) => {
    if (!accessToken) return;
    await applicationsApi.remove(jobPostingId, accessToken);
    fetchApplications(page, filters, sort);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Başvuru Takip Merkezi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Yaptığınız başvuruları ve süreçlerini tek ekrandan yönetin.
          </p>
        </div>
        <select
          value={sort}
          onChange={(e) => {
            const nextSort = e.target.value as 'newest' | 'oldest';
            setSort(nextSort);
            fetchApplications(1, filters, nextSort);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="newest">Başvuru Tarihi (Yeniden Eskiye)</option>
          <option value="oldest">Başvuru Tarihi (Eskiden Yeniye)</option>
        </select>
      </div>

      <ApplicationStats stats={stats} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
        <ApplicationFilters
          cities={cities}
          values={filters}
          onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          onSubmit={() => fetchApplications(1, filters, sort)}
          onClear={() => {
            setFilters(EMPTY_APPLICATION_FILTERS);
            fetchApplications(1, EMPTY_APPLICATION_FILTERS, sort);
          }}
        />

        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-brand-600" size={24} />
              </div>
            </Card>
          ) : applications.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                  <ClipboardList size={26} />
                </span>
                <p className="text-sm font-medium text-slate-700">
                  {totalCount === 0 && stats.total === 0
                    ? 'Henüz takip ettiğiniz bir başvuru yok.'
                    : 'Bu filtrelere uygun başvuru bulunamadı.'}
                </p>
                <p className="max-w-sm text-sm text-slate-500">
                  İlan detay sayfasındaki "Başvurularıma Ekle" butonuyla başvurduğunuz ilanları
                  buradan takip edebilirsiniz.
                </p>
                <Link
                  href="/dashboard/ilanlar"
                  className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Tüm İlanları Görüntüle
                </Link>
              </div>
            </Card>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-500">
                Toplam <span className="font-semibold text-slate-900">{totalCount}</span> başvuru
              </p>
              {applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  city={application.jobPosting.cityId ? cityMap.get(application.jobPosting.cityId) : undefined}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                />
              ))}
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => fetchApplications(p, filters, sort)}
              />
            </>
          )}
        </div>

        <div className="space-y-6">
          <ApplicationSummary stats={stats} />
          <UpcomingEvents events={upcoming} />
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <DashboardShell>
      <ApplicationsContent />
    </DashboardShell>
  );
}
