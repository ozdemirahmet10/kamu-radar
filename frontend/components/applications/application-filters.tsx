import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KPSS_SCORE_TYPES } from '@/components/dashboard/job-filters-panel';
import { APPLICATION_STATUS_LABELS } from './application-status';
import type { ApplicationStatus, City } from '@/lib/api-client';

export interface ApplicationFilterValues {
  status: ApplicationStatus | '';
  keyword: string;
  cityId: string;
  kpssScoreType: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_APPLICATION_FILTERS: ApplicationFilterValues = {
  status: '',
  keyword: '',
  cityId: '',
  kpssScoreType: '',
  dateFrom: '',
  dateTo: '',
};

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

interface ApplicationFiltersProps {
  cities: City[];
  values: ApplicationFilterValues;
  onChange: (patch: Partial<ApplicationFilterValues>) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function ApplicationFilters({
  cities,
  values,
  onChange,
  onSubmit,
  onClear,
}: ApplicationFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Filter size={18} className="text-brand-600" />
          Filtreler
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          Temizle
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label className={labelClass}>Başvuru Durumu</label>
          <select
            className={selectClass}
            value={values.status}
            onChange={(e) => onChange({ status: e.target.value as ApplicationStatus | '' })}
          >
            <option value="">Tümü</option>
            {(Object.entries(APPLICATION_STATUS_LABELS) as [ApplicationStatus, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        <Input
          label="Kurum"
          placeholder="Kurum adı ara..."
          icon={<Search size={16} />}
          value={values.keyword}
          onChange={(e) => onChange({ keyword: e.target.value })}
        />

        <div>
          <label className={labelClass}>Şehir</label>
          <select
            className={selectClass}
            value={values.cityId}
            onChange={(e) => onChange({ cityId: e.target.value })}
          >
            <option value="">Tümü</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>KPSS Türü</label>
          <select
            className={selectClass}
            value={values.kpssScoreType}
            onChange={(e) => onChange({ kpssScoreType: e.target.value })}
          >
            <option value="">Tümü</option>
            {KPSS_SCORE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Başvuru Tarihi</label>
          <div className="space-y-2">
            <input
              type="date"
              aria-label="Başlangıç tarihi"
              className={selectClass}
              value={values.dateFrom}
              onChange={(e) => onChange({ dateFrom: e.target.value })}
            />
            <input
              type="date"
              aria-label="Bitiş tarihi"
              className={selectClass}
              value={values.dateTo}
              onChange={(e) => onChange({ dateTo: e.target.value })}
            />
          </div>
        </div>

        <Button type="button" className="w-full" onClick={onSubmit}>
          Filtrele
        </Button>
      </div>
    </div>
  );
}
