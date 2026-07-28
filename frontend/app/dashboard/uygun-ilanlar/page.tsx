'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Loader2 } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/dashboard/pagination';
import { MatchedJobItem } from '@/components/dashboard/matched-job-item';
import { EMPTY_JOB_FILTERS, JobFilterValues, JobFiltersPanel } from '@/components/dashboard/job-filters-panel';
import { useAuth } from '@/lib/auth-context';
import {
  ApiError,
  citiesApi,
  favoritesApi,
  matchesApi,
  matchFeedbackApi,
  City,
  EligibilityStatus,
  MatchedJobPosting,
} from '@/lib/api-client';

// Bu sayfanın amacı "bana uygun olanlar" olduğu için yalnızca tam uygun
// (ELIGIBLE) ilanlar listelenir — kısmi uygun veya uygun olmayanlar burada
// gösterilmez, onlar "Tüm İlanlar" sayfasında görülebilir.
const ONLY_ELIGIBLE_STATUSES: EligibilityStatus[] = ['ELIGIBLE'];

const PAGE_SIZE = 10;

function toApiParams(filters: JobFilterValues) {
  return {
    kpssScoreType: filters.kpssScoreType || undefined,
    minKpssScore: filters.minKpssScore ? Number(filters.minKpssScore) : undefined,
    maxKpssScore: filters.maxKpssScore ? Number(filters.maxKpssScore) : undefined,
    minimumEducationLevel: filters.minimumEducationLevel || undefined,
    institutionType: filters.institutionType || undefined,
    employmentType: filters.employmentType || undefined,
    cityId: filters.cityId || undefined,
    hasPdf: filters.hasPdf || undefined,
  };
}

function MatchedJobsContent() {
  const { accessToken } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [matches, setMatches] = useState<MatchedJobPosting[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<EligibilityStatus, number>>({
    ELIGIBLE: 0,
    PARTIALLY_ELIGIBLE: 0,
    NOT_ELIGIBLE: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_JOB_FILTERS);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [feedbackByJobId, setFeedbackByJobId] = useState<Map<string, boolean>>(new Map());
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!accessToken) return;
    matchFeedbackApi
      .listMine(accessToken)
      .then((items) =>
        setFeedbackByJobId(new Map(items.map((item) => [item.jobPostingId, item.isAccurate]))),
      )
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

  const fetchMatches = async (targetPage: number, targetFilters: JobFilterValues) => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await matchesApi.list(
        {
          statuses: ONLY_ELIGIBLE_STATUSES,
          ...toApiParams(targetFilters),
          page: targetPage,
          pageSize: PAGE_SIZE,
        },
        accessToken,
      );
      setMatches(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setStatusCounts(result.statusCounts);
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
    if (accessToken) fetchMatches(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bana Uygun İlanlar</h1>
          <p className="mt-1 text-sm text-slate-500">
            KPSS puanınıza ve tercihlerinize göre tam uygun olduğunuz {statusCounts.ELIGIBLE} ilan.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Bookmark size={16} />
          Kaydet
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
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
                  onClick={() => fetchMatches(page, filters)}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Tekrar Dene
                </button>
              </div>
            ) : matches.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Şu anda tam uygun olduğunuz bir ilan bulunamadı. Profilinizi tamamlamak daha
                isabetli eşleşmeler sağlayabilir —{' '}
                <Link href="/dashboard/profil" className="font-semibold text-brand-600">
                  profilinizi güncelleyin
                </Link>
                .
              </p>
            ) : (
              matches.map((match) => (
                <MatchedJobItem
                  key={match.jobPosting.id}
                  match={match}
                  city={match.jobPosting.cityId ? cityMap.get(match.jobPosting.cityId) : undefined}
                  isFavorite={favoriteIds.has(match.jobPosting.id)}
                  onFavoriteChange={handleFavoriteChange}
                  feedbackGiven={feedbackByJobId.get(match.jobPosting.id) ?? null}
                />
              ))
            )}
          </Card>

          <p className="text-center text-xs text-slate-400">Toplam {totalCount} sonuç</p>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => fetchMatches(p, filters)}
          />
        </div>

        <JobFiltersPanel
          cities={cities}
          values={filters}
          onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          onSubmit={() => fetchMatches(1, filters)}
          onClear={() => {
            setFilters(EMPTY_JOB_FILTERS);
            fetchMatches(1, EMPTY_JOB_FILTERS);
          }}
        />
      </div>
    </div>
  );
}

export default function MatchedJobsPage() {
  return (
    <DashboardShell>
      <MatchedJobsContent />
    </DashboardShell>
  );
}
