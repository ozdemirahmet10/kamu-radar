'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import {
  EMPTY_JOB_POSTING_FORM,
  formStateToPayload,
  JobPostingForm,
  JobPostingFormState,
} from '@/components/admin/job-posting-form';
import { useAuth } from '@/lib/auth-context';
import { adminJobPostingsApi, citiesApi, City } from '@/lib/api-client';

function NewJobPostingContent() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState<JobPostingFormState>(EMPTY_JOB_POSTING_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => undefined);
  }, []);

  const patch = (changes: Partial<JobPostingFormState>) =>
    setForm((prev) => ({ ...prev, ...changes }));

  const handleSave = async () => {
    if (!accessToken) return;
    if (!form.institutionName.trim() || !form.positionTitle.trim()) {
      setError('Kurum adı ve kadro adı zorunludur.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const created = await adminJobPostingsApi.create(formStateToPayload(form), accessToken);
      router.push(`/admin/ilanlar/${created.id}`);
    } catch {
      setError('İlan oluşturulamadı, bilgileri kontrol edip tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/admin/ilanlar" className="hover:text-brand-600">
          İlan Yönetimi
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-700">Yeni İlan</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Yeni İlan Oluştur</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manuel olarak yeni bir kamu ilanı girin. Kaydedilen ilan varsayılan olarak yayında olur.
        </p>
      </div>

      <JobPostingForm cities={cities} form={form} onChange={patch} />

      <div className="fixed bottom-0 left-64 right-0 border-t border-slate-100 bg-white/95 px-8 py-4 backdrop-blur">
        <div className="flex items-center justify-end gap-4">
          {error && <span className="text-sm font-medium text-danger-600">{error}</span>}
          <Button onClick={handleSave} isLoading={isSaving}>
            İlanı Oluştur
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewJobPostingPage() {
  return (
    <AdminShell allowedRoles={['ADMIN', 'MODERATOR']}>
      <NewJobPostingContent />
    </AdminShell>
  );
}
