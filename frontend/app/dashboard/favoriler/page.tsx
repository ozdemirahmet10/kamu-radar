'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2 } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { JobPostingCard } from '@/components/dashboard/job-posting-card';
import { Pagination } from '@/components/dashboard/pagination';
import { useAuth } from '@/lib/auth-context';
import {
  citiesApi,
  favoritesApi,
  City,
  FavoriteCategory,
  FavoriteJobPosting,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 5;

const TABS: { label: string; category?: FavoriteCategory }[] = [
  { label: 'Tümü', category: undefined },
  { label: 'Başvurusu Devam Eden', category: 'ACTIVE' },
  { label: 'Yeni Eklenen', category: 'NEW' },
  { label: 'Başvurusu Yaklaşan', category: 'DEADLINE_SOON' },
  { label: 'Süresi Dolan', category: 'EXPIRED' },
];

const EMPTY_CATEGORY_COUNTS: Record<FavoriteCategory, number> = {
  ACTIVE: 0,
  NEW: 0,
  DEADLINE_SOON: 0,
  EXPIRED: 0,
};

function FavoritesContent() {
  const { accessToken } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [favorites, setFavorites] = useState<FavoriteJobPosting[]>([]);
  const [categoryCounts, setCategoryCounts] =
    useState<Record<FavoriteCategory, number>>(EMPTY_CATEGORY_COUNTS);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [isLoading, setIsLoading] = useState(true);

  const cityMap = useMemo(() => new Map(cities.map((city) => [city.id, city])), [cities]);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => undefined);
  }, []);

  const fetchFavorites = async (targetPage: number, tabIndex: number, targetSort: 'newest' | 'oldest') => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await favoritesApi.list(
        { category: TABS[tabIndex].category, sort: targetSort, page: targetPage, pageSize: PAGE_SIZE },
        accessToken,
      );
      setFavorites(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setCategoryCounts(result.categoryCounts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchFavorites(1, 0, 'newest');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleFavoriteChange = (jobPostingId: string, isFavorite: boolean) => {
    if (isFavorite) return;
    const removed = favorites.find((favorite) => favorite.jobPosting.id === jobPostingId);
    setFavorites((prev) => prev.filter((favorite) => favorite.jobPosting.id !== jobPostingId));
    setTotalCount((prev) => Math.max(0, prev - 1));
    if (removed) {
      setCategoryCounts((prev) => ({
        ...prev,
        [removed.category]: Math.max(0, prev[removed.category] - 1),
      }));
    }
  };

  const totalFavorites = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Heart className="text-danger-600" fill="currentColor" size={22} />
            Favorilerim
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kaydettiğiniz ilanları görüntüleyin ve takip edin.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab, index) => {
              const count = tab.category ? categoryCounts[tab.category] : totalFavorites;
              return (
                <button
                  key={tab.label}
                  onClick={() => {
                    setActiveTabIndex(index);
                    fetchFavorites(1, index, sort);
                  }}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    activeTabIndex === index
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>

          <select
            value={sort}
            onChange={(e) => {
              const nextSort = e.target.value as 'newest' | 'oldest';
              setSort(nextSort);
              fetchFavorites(1, activeTabIndex, nextSort);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="newest">Eklenme Tarihi (Yeniden Eskiye)</option>
            <option value="oldest">Eklenme Tarihi (Eskiden Yeniye)</option>
          </select>
        </div>

        <Card>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-brand-600" size={24} />
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <Heart size={26} />
              </span>
              <p className="text-sm font-medium text-slate-700">
                {totalFavorites === 0 ? 'Henüz favori ilanınız yok.' : 'Bu kategoride favori ilan yok.'}
              </p>
              <p className="max-w-sm text-sm text-slate-500">
                İlan kartlarındaki veya ilan detay sayfasındaki kalp ikonuna tıklayarak ilanları
                favorilerinize ekleyebilirsiniz.
              </p>
              <Link
                href="/dashboard/ilanlar"
                className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Tüm İlanları Görüntüle
              </Link>
            </div>
          ) : (
            favorites.map((favorite) => (
              <JobPostingCard
                key={favorite.jobPosting.id}
                job={favorite.jobPosting}
                city={favorite.jobPosting.cityId ? cityMap.get(favorite.jobPosting.cityId) : undefined}
                eligibilityStatus={favorite.status}
                matchPercentage={favorite.matchPercentage}
                isFavorite
                onFavoriteChange={handleFavoriteChange}
              />
            ))
          )}
        </Card>

        {favorites.length > 0 && (
          <>
            <p className="text-center text-xs text-slate-400">Toplam {totalCount} sonuç</p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => fetchFavorites(p, activeTabIndex, sort)}
            />
          </>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Favori Özetim</h2>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalFavorites}</p>
          <p className="text-xs text-slate-500">Toplam Favori İlan</p>
          <div className="mt-4 divide-y divide-slate-100">
            {TABS.filter((tab) => tab.category).map((tab) => (
              <div key={tab.label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-500">{tab.label}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {categoryCounts[tab.category!]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <DashboardShell>
      <FavoritesContent />
    </DashboardShell>
  );
}
