'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2, Plus, X } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CityMultiSelect } from '@/components/ui/city-multi-select';
import { KPSS_SCORE_TYPES } from '@/components/dashboard/job-filters-panel';
import { useAuth } from '@/lib/auth-context';
import {
  citiesApi,
  graduationDepartmentsApi,
  profileApi,
  City,
  DisabilityStatus,
  DISABILITY_STATUS_LABELS,
  EducationLevel,
  EDUCATION_LEVEL_LABELS,
  GraduationDepartment,
  MilitaryStatus,
  MILITARY_STATUS_LABELS,
  UpdateProfilePayload,
} from '@/lib/api-client';

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

interface ProfileFormState {
  birthDate: string;
  educationLevel: EducationLevel | '';
  graduationSchool: string;
  graduationDepartmentId: string;
  kpssYear: string;
  kpssScoreType: string;
  kpssScore: string;
  drivingLicense: boolean;
  ydsScore: string;
  ydsType: string;
  militaryStatus: MilitaryStatus | '';
  disabilityStatus: DisabilityStatus;
  certificates: string[];
  preferredCityIds: string[];
}

const EMPTY_FORM: ProfileFormState = {
  birthDate: '',
  educationLevel: '',
  graduationSchool: '',
  graduationDepartmentId: '',
  kpssYear: '',
  kpssScoreType: '',
  kpssScore: '',
  drivingLicense: false,
  ydsScore: '',
  ydsType: '',
  militaryStatus: '',
  disabilityStatus: 'YOK',
  certificates: [],
  preferredCityIds: [],
};

function EditProfileContent() {
  const { user, accessToken } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [departments, setDepartments] = useState<GraduationDepartment[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [newCertificate, setNewCertificate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    profileApi
      .getMine(accessToken)
      .then((profile) => {
        setForm({
          birthDate: profile.birthDate ?? '',
          educationLevel: profile.educationLevel ?? '',
          graduationSchool: profile.graduationSchool ?? '',
          graduationDepartmentId: profile.graduationDepartmentId ?? '',
          kpssYear: profile.kpssYear ? String(profile.kpssYear) : '',
          kpssScoreType: profile.kpssScoreType ?? '',
          kpssScore: profile.kpssScore !== null ? String(profile.kpssScore) : '',
          drivingLicense: profile.drivingLicense,
          ydsScore: profile.ydsScore !== null ? String(profile.ydsScore) : '',
          ydsType: profile.ydsType ?? '',
          militaryStatus: profile.militaryStatus ?? '',
          disabilityStatus: profile.disabilityStatus,
          certificates: profile.certificates,
          preferredCityIds: profile.preferredCityIds,
        });
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (!form.educationLevel) {
      setDepartments([]);
      return;
    }
    setIsLoadingDepartments(true);
    graduationDepartmentsApi
      .list(form.educationLevel)
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setIsLoadingDepartments(false));
  }, [form.educationLevel]);

  const patch = (changes: Partial<ProfileFormState>) => setForm((prev) => ({ ...prev, ...changes }));

  const addCertificate = () => {
    const trimmed = newCertificate.trim();
    if (trimmed && !form.certificates.includes(trimmed)) {
      patch({ certificates: [...form.certificates, trimmed] });
    }
    setNewCertificate('');
  };

  const removeCertificate = (certificate: string) => {
    patch({ certificates: form.certificates.filter((c) => c !== certificate) });
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    setSaveNotice(null);

    const payload: UpdateProfilePayload = {
      birthDate: form.birthDate || undefined,
      educationLevel: form.educationLevel || undefined,
      graduationSchool: form.graduationSchool || undefined,
      graduationDepartmentId: form.graduationDepartmentId || undefined,
      kpssYear: form.kpssYear ? Number(form.kpssYear) : undefined,
      kpssScoreType: form.kpssScoreType || undefined,
      kpssScore: form.kpssScore ? Number(form.kpssScore) : undefined,
      drivingLicense: form.drivingLicense,
      ydsScore: form.ydsScore ? Number(form.ydsScore) : undefined,
      ydsType: form.ydsType || undefined,
      militaryStatus: form.militaryStatus || undefined,
      disabilityStatus: form.disabilityStatus,
      certificates: form.certificates,
      preferredCityIds: form.preferredCityIds,
    };

    try {
      const updated = await profileApi.update(payload, accessToken);
      setForm({
        birthDate: updated.birthDate ?? '',
        educationLevel: updated.educationLevel ?? '',
        graduationSchool: updated.graduationSchool ?? '',
        graduationDepartmentId: updated.graduationDepartmentId ?? '',
        kpssYear: updated.kpssYear ? String(updated.kpssYear) : '',
        kpssScoreType: updated.kpssScoreType ?? '',
        kpssScore: updated.kpssScore !== null ? String(updated.kpssScore) : '',
        drivingLicense: updated.drivingLicense,
        ydsScore: updated.ydsScore !== null ? String(updated.ydsScore) : '',
        ydsType: updated.ydsType ?? '',
        militaryStatus: updated.militaryStatus ?? '',
        disabilityStatus: updated.disabilityStatus,
        certificates: updated.certificates,
        preferredCityIds: updated.preferredCityIds,
      });
      setSaveNotice('success');
    } catch {
      setSaveNotice('error');
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-brand-600">
          Ana Sayfa
        </Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/profil" className="hover:text-brand-600">
          Profilim
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-700">Profili Düzenle</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profili Düzenle</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bilgileriniz ne kadar eksiksiz olursa, ilan eşleştirmeleriniz o kadar isabetli olur.
        </p>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Kişisel &amp; Eğitim Bilgileri</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Input
            label="Doğum Tarihi"
            type="date"
            value={form.birthDate}
            onChange={(e) => patch({ birthDate: e.target.value })}
          />
          <div>
            <label className={labelClass}>Öğrenim Seviyesi</label>
            <select
              className={selectClass}
              value={form.educationLevel}
              onChange={(e) =>
                patch({
                  educationLevel: e.target.value as EducationLevel | '',
                  graduationDepartmentId: '',
                })
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
          <Input
            label="Mezuniyet Okulu"
            value={form.graduationSchool}
            onChange={(e) => patch({ graduationSchool: e.target.value })}
            placeholder="Örn. Ankara Üniversitesi"
          />
          <div>
            <label className={labelClass}>Mezuniyet Bölümü</label>
            <select
              className={selectClass}
              value={form.graduationDepartmentId}
              onChange={(e) => patch({ graduationDepartmentId: e.target.value })}
              disabled={!form.educationLevel || isLoadingDepartments}
            >
              <option value="">
                {!form.educationLevel
                  ? 'Önce öğrenim seviyesi seçin'
                  : isLoadingDepartments
                    ? 'Yükleniyor...'
                    : 'Seçiniz'}
              </option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-400">
              Bölümünüzü seçtiğinizde uygun olduğunuz ÖSYM nitelik kodları profilinizde otomatik
              hesaplanır.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">KPSS Bilgileri</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <Input
            label="KPSS Yılı"
            type="number"
            value={form.kpssYear}
            onChange={(e) => patch({ kpssYear: e.target.value })}
            placeholder="2026"
          />
          <div>
            <label className={labelClass}>Puan Türü</label>
            <select
              className={selectClass}
              value={form.kpssScoreType}
              onChange={(e) => patch({ kpssScoreType: e.target.value })}
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
            label="Puanınız"
            type="number"
            min={0}
            max={100}
            value={form.kpssScore}
            onChange={(e) => patch({ kpssScore: e.target.value })}
            placeholder="0-100"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Diğer Nitelikler</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Checkbox
              name="drivingLicense"
              label="B sınıfı (veya üzeri) ehliyetim var"
              checked={form.drivingLicense}
              onChange={(e) => patch({ drivingLicense: e.target.checked })}
            />
          </div>
          <Input
            label="YDS Puanı"
            type="number"
            min={0}
            max={100}
            value={form.ydsScore}
            onChange={(e) => patch({ ydsScore: e.target.value })}
          />
          <Input
            label="YDS Dili"
            value={form.ydsType}
            onChange={(e) => patch({ ydsType: e.target.value })}
            placeholder="Örn. İngilizce"
          />
          <div>
            <label className={labelClass}>Askerlik Durumu</label>
            <select
              className={selectClass}
              value={form.militaryStatus}
              onChange={(e) => patch({ militaryStatus: e.target.value as MilitaryStatus | '' })}
            >
              <option value="">Seçiniz</option>
              {Object.entries(MILITARY_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Engellilik Durumu</label>
            <select
              className={selectClass}
              value={form.disabilityStatus}
              onChange={(e) => patch({ disabilityStatus: e.target.value as DisabilityStatus })}
            >
              {Object.entries(DISABILITY_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Sertifikalarım</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {form.certificates.length === 0 && (
            <p className="text-sm text-slate-400">Henüz sertifika eklenmedi.</p>
          )}
          {form.certificates.map((certificate) => (
            <Badge key={certificate} variant="info" className="gap-1.5 py-1.5 pl-3 pr-2">
              {certificate}
              <button
                type="button"
                onClick={() => removeCertificate(certificate)}
                className="rounded-full p-0.5 hover:bg-brand-100"
                aria-label={`${certificate} sertifikasını kaldır`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            value={newCertificate}
            onChange={(e) => setNewCertificate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCertificate();
              }
            }}
            placeholder="Örn. B Sınıfı Ehliyet"
          />
          <Button type="button" variant="outline" onClick={addCertificate} className="shrink-0 gap-1.5">
            <Plus size={16} />
            Ekle
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">Tercih Ettiğiniz Şehirler</h2>
        <p className="mt-1 text-sm text-slate-500">
          Seçtiğiniz şehirler, eşleştirmelerinizde ilanın konumuyla ne kadar örtüştüğünü belirler.
        </p>
        <div className="mt-4">
          <CityMultiSelect
            cities={cities}
            selectedCityIds={form.preferredCityIds}
            onChange={(cityIds) => setForm((prev) => ({ ...prev, preferredCityIds: cityIds }))}
          />
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-100 bg-white/95 px-8 py-4 backdrop-blur lg:pl-[19rem]">
        <div className="flex items-center justify-end gap-4">
          {saveNotice === 'success' && (
            <span className="text-sm font-medium text-success-700">Profil kaydedildi.</span>
          )}
          {saveNotice === 'error' && (
            <span className="text-sm font-medium text-danger-600">Kaydedilemedi, tekrar deneyin.</span>
          )}
          <Button onClick={handleSave} isLoading={isSaving}>
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <DashboardShell>
      <EditProfileContent />
    </DashboardShell>
  );
}
