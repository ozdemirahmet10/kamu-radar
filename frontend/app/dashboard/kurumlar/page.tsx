'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, MapPin } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconTile } from '@/components/ui/icon-tile';
import { Pagination } from '@/components/dashboard/pagination';
import {
  citiesApi,
  institutionsApi,
  City,
  Institution,
  InstitutionType,
  INSTITUTION_TYPE_LABELS,
} from '@/lib/api-client';

const PAGE_SIZE = 12;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function InstitutionsContent() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [institutionType, setInstitutionType] = useState<InstitutionType | ''>('');
  const [sortBy, setSortBy] = useState<'activeCount' | 'nearestDeadline'>('activeCount');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const cityMap = useMemo(() => new Map(cities.map((city) => [city.id, city.name])), [cities]);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => undefined);
  }, []);

  const fetchInstitutions = async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await institutionsApi.list({
        keyword: keyword || undefined,
        institutionType: institutionType || undefined,
        sortBy,
        page: targetPage,
        pageSize: PAGE_SIZE,
      });
      setInstitutions(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch {
      setError('Kurumlar yüklenirken bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchInstitutions(1);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, institutionType, sortBy]);

  const cityLabel = (cityIds: string[]): string => {
    if (cityIds.length === 0) return '—';
    if (cityIds.length === 1) return cityMap.get(cityIds[0]) ?? '—';
    return `${cityIds.length} şehir`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kurumlar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Aktif ilanı olan kamu kurumlarını inceleyin. Toplam{' '}
          <span className="font-semibold text-slate-900">{totalCount}</span> kurum.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Kurum adında ara..."
            className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <select
            value={institutionType}
            onChange={(e) => setInstitutionType(e.target.value as InstitutionType | '')}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Tüm Kurum Türleri</option>
            {Object.entries(INSTITUTION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'activeCount' | 'nearestDeadline')}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="activeCount">En Çok Aktif İlan</option>
            <option value="nearestDeadline">En Yakın Son Başvuru</option>
          </select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-600" size={24} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm font-medium text-danger-600">{error}</p>
          <button
            type="button"
            onClick={() => fetchInstitutions(page)}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Tekrar Dene
          </button>
        </div>
      ) : institutions.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">
          Arama kriterlerinize uygun kurum bulunamadı.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {institutions.map((institution) => (
            <Link
              key={institution.institutionName}
              href={`/dashboard/ilanlar?institution=${encodeURIComponent(institution.institutionName)}`}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start gap-3">
                  <IconTile icon={<Building2 size={18} />} color="info" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {institution.institutionName}
                    </p>
                    {institution.institutionType && (
                      <Badge variant="neutral" className="mt-1">
                        {INSTITUTION_TYPE_LABELS[institution.institutionType]}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Aktif İlan</p>
                    <p className="font-semibold text-slate-900">{institution.activeJobPostingCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Toplam Kontenjan</p>
                    <p className="font-semibold text-slate-900">
                      {institution.totalQuota ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} />
                    {cityLabel(institution.cityIds)}
                  </span>
                  {institution.nearestDeadline && (
                    <span>Son başvuru: {formatDate(institution.nearestDeadline)}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && !error && institutions.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchInstitutions(p)} />
      )}
    </div>
  );
}

export default function InstitutionsPage() {
  return (
    <DashboardShell>
      <InstitutionsContent />
    </DashboardShell>
  );
}
