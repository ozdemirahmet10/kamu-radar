'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { JobPostingCard } from '@/components/dashboard/job-posting-card';
import { Pagination } from '@/components/dashboard/pagination';
import { AdSlot } from '@/components/ads/ad-slot';
import { EMPTY_JOB_FILTERS, JobFilterValues, JobFiltersPanel } from '@/components/dashboard/job-filters-panel';
import { useAuth } from '@/lib/auth-context';
import {
  ApiError,
  citiesApi,
  favoritesApi,
  matchesApi,
  City,
  EligibilityStatus,
  MatchedJobPosting,
  MatchesSortBy,
} from '@/lib/api-client';

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: MatchesSortBy; label: string }[] = [
  { value: 'matchPercentage', label: 'Uygunluk (Yüksekten Düşüğe)' },
  { value: 'newest', label: 'Tarih (Yeniden Eskiye)' },
  { value: 'oldest', label: 'Tarih (Eskiden Yeniye)' },
  { value: 'deadlineSoon', label: 'Son Başvuru (Yakından Uzağa)' },
  { value: 'quotaHigh', label: 'Kontenjan (Çoktan Aza)' },
];

function toEligibilityStatuses(eligibility: JobFilterValues['eligibility']): EligibilityStatus[] | undefined {
  if (eligibility === 'ELIGIBLE') return ['ELIGIBLE', 'PARTIALLY_ELIGIBLE'];
  if (eligibility === 'NOT_ELIGIBLE') return ['NOT_ELIGIBLE'];
  return undefined;
}

interface QuickFilter {
  createdAfter?: string;
  deadlineWithinDays?: number;
  keyword?: string;
  label: string;
}

function toApiParams(
  filters: JobFilterValues,
  page: number,
  quickFilter: QuickFilter | null,
  sortBy: MatchesSortBy,
) {
  return {
    statuses: toEligibilityStatuses(filters.eligibility),
    kpssScoreType: filters.kpssScoreType || undefined,
    minKpssScore: filters.minKpssScore ? Number(filters.minKpssScore) : undefined,
    maxKpssScore: filters.maxKpssScore ? Number(filters.maxKpssScore) : undefined,
    minimumEducationLevel: filters.minimumEducationLevel || undefined,
    institutionType: filters.institutionType || undefined,
    employmentType: filters.employmentType || undefined,
    cityId: filters.cityId || undefined,
    hasPdf: filters.hasPdf || undefined,
    createdAfter: quickFilter?.createdAfter,
    deadlineWithinDays: quickFilter?.deadlineWithinDays,
    keyword: quickFilter?.keyword,
    sortBy,
    page,
    pageSize: PAGE_SIZE,
  };
}

function readQuickFilter(searchParams: URLSearchParams): QuickFilter | null {
  if (searchParams.get('createdToday') === '1') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return { createdAfter: todayStart.toISOString(), label: 'Bugün eklenen ilanlar gösteriliyor' };
  }
  const deadlineDays = searchParams.get('deadlineDays');
  if (deadlineDays) {
    return {
      deadlineWithinDays: Number(deadlineDays),
      label: `Son başvurusu ${deadlineDays} gün içinde biten ilanlar gösteriliyor`,
    };
  }
  const institution = searchParams.get('institution');
  if (institution) {
    return { keyword: institution, label: `"${institution}" kurumunun ilanları gösteriliyor` };
  }
  return null;
}

function AllJobPostingsContent() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<City[]>([]);
  const [matches, setMatches] = useState<MatchedJobPosting[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<JobFilterValues>(EMPTY_JOB_FILTERS);
  const [sortBy, setSortBy] = useState<MatchesSortBy>('matchPercentage');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const quickFilter = useMemo(() => readQuickFilter(searchParams), [searchParams]);

  const cityMap = useMemo(() => new Map(cities.map((city) => [city.id, city])), [cities]);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    favoritesApi
      .listIds(accessToken)
      .then((ids) => setFavoriteIds(new Set(ids)))
      .catch(() => undefined);
  }, [accessToken]);

  const handleFavoriteChange = (jobPostingId: string, isFavorite: boolean) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.add(jobPostingId);
      else next.delete(jobPostingId);
      return next;
    });
  };

  const fetchJobs = async (targetPage: number) => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await matchesApi.list(
        toApiParams(filters, targetPage, quickFilter, sortBy),
        accessToken,
      );
      setMatches(result.items);
      setPage(result.page);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'İlanlar yüklenirken bir hata oluştu, lütfen tekrar deneyin.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, quickFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tüm İlanlar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tüm kamu kurumlarının güncel ilanlarını görüntüleyin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as MatchesSortBy)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {quickFilter && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <span>{quickFilter.label}</span>
          <Link
            href="/dashboard/ilanlar"
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
          >
            <X size={14} />
            Filtreyi Kaldır
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <JobFiltersPanel
            cities={cities}
            values={filters}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            onSubmit={() => fetchJobs(1)}
            onClear={() => {
              setFilters(EMPTY_JOB_FILTERS);
              setTimeout(() => fetchJobs(1), 0);
            }}
            showEligibilityFilter
          />
          <AdSlot slot="ilanlar-sidebar" />
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-500">
            Toplam <span className="font-semibold text-slate-900">{totalCount}</span> ilan bulundu.
          </p>

          <Card>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-brand-600" size={24} />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm font-medium text-danger-600">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchJobs(page)}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Tekrar Dene
                </button>
              </div>
            ) : matches.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Arama kriterlerinize uygun ilan bulunamadı.
              </p>
            ) : (
              matches.map((match) => (
                <JobPostingCard
                  key={match.jobPosting.id}
                  job={match.jobPosting}
                  city={match.jobPosting.cityId ? cityMap.get(match.jobPosting.cityId) : undefined}
                  eligibilityStatus={match.status}
                  isFavorite={favoriteIds.has(match.jobPosting.id)}
                  onFavoriteChange={handleFavoriteChange}
                />
              ))
            )}
          </Card>

          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchJobs(p)} />
        </div>
      </div>
    </div>
  );
}

export default function AllJobPostingsPage() {
  return (
    <DashboardShell>
      <Suspense fallback={null}>
        <AllJobPostingsContent />
      </Suspense>
    </DashboardShell>
  );
}
