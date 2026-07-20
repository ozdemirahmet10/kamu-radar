'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { KPSS_SCORE_TYPES } from '@/components/dashboard/job-filters-panel';
import {
  City,
  EducationLevel,
  EDUCATION_LEVEL_LABELS,
  EmploymentType,
  EMPLOYMENT_TYPE_LABELS,
  InstitutionType,
  INSTITUTION_TYPE_LABELS,
  QualificationCode,
  AdminJobPostingPayload,
} from '@/lib/api-client';

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

export interface JobPostingFormState {
  institutionName: string;
  positionTitle: string;
  institutionType: InstitutionType | '';
  cityId: string;
  quotaCount: string;
  employmentType: EmploymentType | '';
  minimumEducationLevel: EducationLevel | '';
  kpssScoreType: string;
  minKpssScore: string;
  minAge: string;
  maxAge: string;
  requiresExperience: boolean;
  applicationStartDate: string;
  applicationEndDate: string;
  applicationUrl: string;
  description: string;
  qualificationCodes: QualificationCode[];
  departments: string[];
}

export const EMPTY_JOB_POSTING_FORM: JobPostingFormState = {
  institutionName: '',
  positionTitle: '',
  institutionType: '',
  cityId: '',
  quotaCount: '',
  employmentType: '',
  minimumEducationLevel: '',
  kpssScoreType: '',
  minKpssScore: '',
  minAge: '',
  maxAge: '',
  requiresExperience: false,
  applicationStartDate: '',
  applicationEndDate: '',
  applicationUrl: '',
  description: '',
  qualificationCodes: [],
  departments: [],
};

export function formStateToPayload(form: JobPostingFormState): AdminJobPostingPayload {
  return {
    institutionName: form.institutionName || undefined,
    positionTitle: form.positionTitle || undefined,
    institutionType: form.institutionType || undefined,
    cityId: form.cityId || undefined,
    quotaCount: form.quotaCount ? Number(form.quotaCount) : undefined,
    employmentType: form.employmentType || undefined,
    minimumEducationLevel: form.minimumEducationLevel || undefined,
    kpssScoreType: form.kpssScoreType || undefined,
    minKpssScore: form.minKpssScore ? Number(form.minKpssScore) : undefined,
    minAge: form.minAge ? Number(form.minAge) : undefined,
    maxAge: form.maxAge ? Number(form.maxAge) : undefined,
    requiresExperience: form.requiresExperience,
    applicationStartDate: form.applicationStartDate
      ? new Date(form.applicationStartDate).toISOString()
      : undefined,
    applicationEndDate: form.applicationEndDate
      ? new Date(form.applicationEndDate).toISOString()
      : undefined,
    applicationUrl: form.applicationUrl || undefined,
    description: form.description || undefined,
    qualificationCodes: form.qualificationCodes,
    departments: form.departments,
  };
}

interface JobPostingFormProps {
  cities: City[];
  form: JobPostingFormState;
  onChange: (patch: Partial<JobPostingFormState>) => void;
}

export function JobPostingForm({ cities, form, onChange }: JobPostingFormProps) {
  const [newDepartment, setNewDepartment] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCodeDescription, setNewCodeDescription] = useState('');

  const addDepartment = () => {
    const trimmed = newDepartment.trim();
    if (trimmed && !form.departments.includes(trimmed)) {
      onChange({ departments: [...form.departments, trimmed] });
    }
    setNewDepartment('');
  };

  const addQualificationCode = () => {
    const code = newCode.trim();
    if (code && !form.qualificationCodes.some((qc) => qc.code === code)) {
      onChange({
        qualificationCodes: [
          ...form.qualificationCodes,
          { code, description: newCodeDescription.trim() || null },
        ],
      });
    }
    setNewCode('');
    setNewCodeDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Temel Bilgiler</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Input
            label="Kurum Adı"
            value={form.institutionName}
            onChange={(e) => onChange({ institutionName: e.target.value })}
            placeholder="Örn. Sanayi ve Teknoloji Bakanlığı"
          />
          <Input
            label="Kadro / Pozisyon Adı"
            value={form.positionTitle}
            onChange={(e) => onChange({ positionTitle: e.target.value })}
            placeholder="Örn. Bilişim Personeli"
          />
          <div>
            <label className={labelClass}>Kurum Türü</label>
            <select
              className={selectClass}
              value={form.institutionType}
              onChange={(e) => onChange({ institutionType: e.target.value as InstitutionType | '' })}
            >
              <option value="">Seçiniz</option>
              {Object.entries(INSTITUTION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Şehir</label>
            <select
              className={selectClass}
              value={form.cityId}
              onChange={(e) => onChange({ cityId: e.target.value })}
            >
              <option value="">Seçiniz / Belirtilmemiş</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Kontenjan"
            type="number"
            min={1}
            value={form.quotaCount}
            onChange={(e) => onChange({ quotaCount: e.target.value })}
          />
          <div>
            <label className={labelClass}>İstihdam Türü</label>
            <select
              className={selectClass}
              value={form.employmentType}
              onChange={(e) => onChange({ employmentType: e.target.value as EmploymentType | '' })}
            >
              <option value="">Seçiniz</option>
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Aday Şartları</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Asgari Öğrenim Seviyesi</label>
            <select
              className={selectClass}
              value={form.minimumEducationLevel}
              onChange={(e) =>
                onChange({ minimumEducationLevel: e.target.value as EducationLevel | '' })
              }
            >
              <option value="">Seçiniz</option>
              {Object.entries(EDUCATION_LEVEL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>KPSS Puan Türü</label>
            <select
              className={selectClass}
              value={form.kpssScoreType}
              onChange={(e) => onChange({ kpssScoreType: e.target.value })}
            >
              <option value="">Seçiniz</option>
              {KPSS_SCORE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Asgari KPSS Puanı"
            type="number"
            min={0}
            max={100}
            value={form.minKpssScore}
            onChange={(e) => onChange({ minKpssScore: e.target.value })}
          />
          <Input
            label="Asgari Yaş"
            type="number"
            min={0}
            value={form.minAge}
            onChange={(e) => onChange({ minAge: e.target.value })}
          />
          <Input
            label="Azami Yaş"
            type="number"
            min={0}
            value={form.maxAge}
            onChange={(e) => onChange({ maxAge: e.target.value })}
          />
          <div className="flex items-end pb-3">
            <Checkbox
              name="requiresExperience"
              label="Deneyim şartı var"
              checked={form.requiresExperience}
              onChange={(e) => onChange({ requiresExperience: e.target.checked })}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Başvuru Bilgileri</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Input
            label="Başvuru Başlangıç Tarihi"
            type="date"
            value={form.applicationStartDate}
            onChange={(e) => onChange({ applicationStartDate: e.target.value })}
          />
          <Input
            label="Başvuru Bitiş Tarihi"
            type="date"
            value={form.applicationEndDate}
            onChange={(e) => onChange({ applicationEndDate: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label="Başvuru URL'si"
              value={form.applicationUrl}
              onChange={(e) => onChange({ applicationUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Açıklama</label>
            <textarea
              className={selectClass}
              rows={4}
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="İlana dair serbest metin açıklama"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Kabul Edilen Bölümler</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {form.departments.length === 0 && (
            <p className="text-sm text-slate-400">Henüz bölüm eklenmedi.</p>
          )}
          {form.departments.map((department) => (
            <Badge key={department} variant="info" className="gap-1.5 py-1.5 pl-3 pr-2">
              {department}
              <button
                type="button"
                onClick={() => onChange({ departments: form.departments.filter((d) => d !== department) })}
                className="rounded-full p-0.5 hover:bg-brand-100"
                aria-label={`${department} bölümünü kaldır`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addDepartment();
              }
            }}
            placeholder="Örn. Bilgisayar Mühendisliği"
          />
          <Button type="button" variant="outline" onClick={addDepartment} className="shrink-0 gap-1.5">
            <Plus size={16} />
            Ekle
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Nitelik Kodları</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {form.qualificationCodes.length === 0 && (
            <p className="text-sm text-slate-400">Henüz nitelik kodu eklenmedi.</p>
          )}
          {form.qualificationCodes.map((qc) => (
            <Badge key={qc.code} variant="neutral" className="gap-1.5 py-1.5 pl-3 pr-2">
              {qc.code}
              {qc.description ? ` - ${qc.description}` : ''}
              <button
                type="button"
                onClick={() =>
                  onChange({
                    qualificationCodes: form.qualificationCodes.filter((c) => c.code !== qc.code),
                  })
                }
                className="rounded-full p-0.5 hover:bg-slate-200"
                aria-label={`${qc.code} kodunu kaldır`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Kod (Örn. 4531)"
            className="max-w-[140px]"
          />
          <Input
            value={newCodeDescription}
            onChange={(e) => setNewCodeDescription(e.target.value)}
            placeholder="Açıklama (opsiyonel)"
          />
          <Button type="button" variant="outline" onClick={addQualificationCode} className="shrink-0 gap-1.5">
            <Plus size={16} />
            Ekle
          </Button>
        </div>
      </div>
    </div>
  );
}
