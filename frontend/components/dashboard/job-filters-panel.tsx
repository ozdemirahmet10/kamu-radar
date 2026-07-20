import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  City,
  EducationLevel,
  EDUCATION_LEVEL_LABELS,
  EmploymentType,
  EMPLOYMENT_TYPE_LABELS,
  InstitutionType,
  INSTITUTION_TYPE_LABELS,
} from '@/lib/api-client';

export const KPSS_SCORE_TYPES = ['P1', 'P2', 'P3', 'P93', 'P94', 'P97', 'P118', 'P123'];

export type EligibilityFilter = '' | 'ELIGIBLE' | 'NOT_ELIGIBLE';

export interface JobFilterValues {
  kpssScoreType: string;
  minKpssScore: string;
  maxKpssScore: string;
  minimumEducationLevel: EducationLevel | '';
  institutionType: InstitutionType | '';
  employmentType: EmploymentType | '';
  cityId: string;
  eligibility: EligibilityFilter;
  hasPdf: boolean;
}

export const EMPTY_JOB_FILTERS: JobFilterValues = {
  kpssScoreType: '',
  minKpssScore: '0',
  maxKpssScore: '100',
  minimumEducationLevel: '',
  institutionType: '',
  employmentType: '',
  cityId: '',
  eligibility: '',
  hasPdf: false,
};

interface JobFiltersPanelProps {
  cities: City[];
  values: JobFilterValues;
  onChange: (patch: Partial<JobFilterValues>) => void;
  onSubmit: () => void;
  onClear: () => void;
  title?: string;
  showEligibilityFilter?: boolean;
}

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

const EMPLOYMENT_TYPES: EmploymentType[] = [
  'SUREKLI_ISCI',
  'MEMUR',
  'SOZLESMELI_PERSONEL',
  'GECICI_PERSONEL',
];

export function JobFiltersPanel({
  cities,
  values,
  onChange,
  onSubmit,
  onClear,
  title = 'Filtreler',
  showEligibilityFilter = false,
}: JobFiltersPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Filter size={18} className="text-brand-600" />
          {title}
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          Filtreleri Temizle
        </button>
      </div>

      <div className="mt-5 space-y-5">
        {showEligibilityFilter && (
          <div>
            <label className={labelClass}>Başvuru Durumu</label>
            <select
              className={selectClass}
              value={values.eligibility}
              onChange={(e) => onChange({ eligibility: e.target.value as EligibilityFilter })}
            >
              <option value="">Tümü</option>
              <option value="ELIGIBLE">Başvurulabilir</option>
              <option value="NOT_ELIGIBLE">Başvurulamaz</option>
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>KPSS Puan Türü</label>
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
          <label className={labelClass}>KPSS Puan Aralığı</label>
          <div className="mb-2 h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-brand-600"
              style={{
                marginLeft: `${Number(values.minKpssScore || 0)}%`,
                width: `${Math.max(0, Number(values.maxKpssScore || 100) - Number(values.minKpssScore || 0))}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              className={selectClass}
              value={values.minKpssScore}
              onChange={(e) => onChange({ minKpssScore: e.target.value })}
            />
            <span className="text-slate-400">–</span>
            <input
              type="number"
              min={0}
              max={100}
              className={selectClass}
              value={values.maxKpssScore}
              onChange={(e) => onChange({ maxKpssScore: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Öğrenim Durumu</label>
          <select
            className={selectClass}
            value={values.minimumEducationLevel}
            onChange={(e) =>
              onChange({ minimumEducationLevel: e.target.value as EducationLevel | '' })
            }
          >
            <option value="">Tümü</option>
            {Object.entries(EDUCATION_LEVEL_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Kurum Türü</label>
          <select
            className={selectClass}
            value={values.institutionType}
            onChange={(e) => onChange({ institutionType: e.target.value as InstitutionType | '' })}
          >
            <option value="">Tümü</option>
            {Object.entries(INSTITUTION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>İl</label>
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
          <label className={labelClass}>İlan Türü</label>
          <div className="space-y-2">
            {EMPLOYMENT_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-100"
                  checked={values.employmentType === type}
                  onChange={() =>
                    onChange({ employmentType: values.employmentType === type ? '' : type })
                  }
                />
                {EMPLOYMENT_TYPE_LABELS[type]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-100"
              checked={values.hasPdf}
              onChange={(e) => onChange({ hasPdf: e.target.checked })}
            />
            İlan Dokümanı (PDF) Eklenenler
          </label>
        </div>

        <Button type="button" className="w-full" onClick={onSubmit}>
          Filtrele
        </Button>
      </div>
    </div>
  );
}
