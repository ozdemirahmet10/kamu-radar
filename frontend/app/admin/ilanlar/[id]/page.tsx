'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, FileText, Loader2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  EMPTY_JOB_POSTING_FORM,
  formStateToPayload,
  JobPostingForm,
  JobPostingFormState,
} from '@/components/admin/job-posting-form';
import { useAuth } from '@/lib/auth-context';
import {
  API_BASE_URL,
  adminJobPostingsApi,
  citiesApi,
  City,
  JobPosting,
  JobPostingVersion,
} from '@/lib/api-client';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  PUBLISHED: 'Yayında',
  EXPIRED: 'Süresi Doldu',
  ARCHIVED: 'Arşivlendi',
  PENDING_REVIEW: 'İncelemede',
};

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

function jobPostingToFormState(job: JobPosting): JobPostingFormState {
  return {
    institutionName: job.institutionName,
    positionTitle: job.positionTitle,
    institutionType: job.institutionType ?? '',
    cityId: job.cityId ?? '',
    quotaCount: job.quotaCount !== null ? String(job.quotaCount) : '',
    employmentType: job.employmentType ?? '',
    minimumEducationLevel: job.minimumEducationLevel ?? '',
    kpssScoreType: job.kpssScoreType ?? '',
    minKpssScore: job.minKpssScore !== null ? String(job.minKpssScore) : '',
    minAge: job.minAge !== null ? String(job.minAge) : '',
    maxAge: job.maxAge !== null ? String(job.maxAge) : '',
    requiresExperience: job.requiresExperience,
    applicationStartDate: toDateInputValue(job.applicationStartDate),
    applicationEndDate: toDateInputValue(job.applicationEndDate),
    applicationUrl: job.applicationUrl ?? '',
    description: job.description ?? '',
    qualificationCodes: job.qualificationCodes.map((qc) => ({
      code: qc.code,
      description: qc.description,
    })),
    departments: job.departments,
  };
}

function EditJobPostingContent() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [cities, setCities] = useState<City[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [hasPdf, setHasPdf] = useState(false);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [form, setForm] = useState<JobPostingFormState>(EMPTY_JOB_POSTING_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<'success' | 'error' | null>(null);
  const [versions, setVersions] = useState<JobPostingVersion[]>([]);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!accessToken || !params.id) return;
    adminJobPostingsApi
      .getById(params.id, accessToken)
      .then((job) => {
        setForm(jobPostingToFormState(job));
        setStatus(job.status);
        setHasPdf(job.hasPdf);
        setSourceName(job.sourceName);
      })
      .finally(() => setIsLoading(false));
    adminJobPostingsApi
      .listVersions(params.id, accessToken)
      .then(setVersions)
      .catch(() => undefined);
  }, [accessToken, params.id]);

  const patch = (changes: Partial<JobPostingFormState>) =>
    setForm((prev) => ({ ...prev, ...changes }));

  const handleSave = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    setNotice(null);
    try {
      const updated = await adminJobPostingsApi.update(
        params.id,
        formStateToPayload(form),
        accessToken,
      );
      setStatus(updated.status);
      setNotice('success');
    } catch {
      setNotice('error');
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleApprove = async () => {
    if (!accessToken) return;
    const updated = await adminJobPostingsApi.approve(params.id, accessToken);
    setStatus(updated.status);
  };

  const handleArchive = async () => {
    if (!accessToken) return;
    if (!window.confirm('Bu ilanı arşivlemek istediğinize emin misiniz?')) return;
    await adminJobPostingsApi.archive(params.id, accessToken);
    router.push('/admin/ilanlar');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/admin/ilanlar" className="hover:text-brand-600">
          İlan Yönetimi
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-700">İlanı Düzenle</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İlanı Düzenle</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-slate-500">Durum:</span>
            {status && (
              <Badge variant={status === 'PUBLISHED' ? 'success' : status === 'PENDING_REVIEW' ? 'warning' : 'neutral'}>
                {STATUS_LABELS[status] ?? status}
              </Badge>
            )}
            {sourceName && (
              <>
                <span className="text-sm text-slate-500">Kaynak:</span>
                <Badge variant="neutral">{sourceName}</Badge>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {hasPdf ? (
            <a
              href={`${API_BASE_URL}/job-postings/${params.id}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <FileText size={16} />
                İlan Metni (PDF)
              </Button>
            </a>
          ) : (
            <span title="İlan için PDF doküman eklenmemiş">
              <Button variant="outline" className="gap-2" disabled>
                <FileText size={16} />
                İlan Metni (PDF)
              </Button>
            </span>
          )}
          {status === 'PENDING_REVIEW' && (
            <Button variant="outline" onClick={handleApprove}>
              Onayla ve Yayınla
            </Button>
          )}
          {status !== 'ARCHIVED' && (
            <Button
              variant="outline"
              className="text-danger-600 hover:bg-danger-50"
              onClick={handleArchive}
            >
              Arşivle
            </Button>
          )}
        </div>
      </div>

      <JobPostingForm cities={cities} form={form} onChange={patch} />

      <div className="rounded-2xl border border-slate-100 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Değişiklik Geçmişi</h2>
        {versions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Bu ilan için kayıtlı bir değişiklik yok.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {versions.map((version) => (
              <li key={version.id} className="rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedVersionId((prev) => (prev === version.id ? null : version.id))
                  }
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                >
                  <span className="text-slate-700">
                    {version.changeReason ?? 'Güncelleme'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(version.changedAt).toLocaleString('tr-TR')}
                  </span>
                </button>
                {expandedVersionId === version.id && (
                  <pre className="overflow-x-auto border-t border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
                    {JSON.stringify(version.snapshot, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed bottom-0 left-64 right-0 border-t border-slate-100 bg-white/95 px-8 py-4 backdrop-blur">
        <div className="flex items-center justify-end gap-4">
          {notice === 'success' && (
            <span className="text-sm font-medium text-success-700">Kaydedildi.</span>
          )}
          {notice === 'error' && (
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

export default function EditJobPostingPage() {
  return (
    <AdminShell allowedRoles={['ADMIN', 'MODERATOR']}>
      <EditJobPostingContent />
    </AdminShell>
  );
}
