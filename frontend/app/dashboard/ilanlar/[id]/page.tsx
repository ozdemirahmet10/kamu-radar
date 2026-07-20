'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  Heart,
  Linkedin,
  Loader2,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  API_BASE_URL,
  applicationsApi,
  citiesApi,
  favoritesApi,
  jobPostingsApi,
  City,
  JobPosting,
  INSTITUTION_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EDUCATION_LEVEL_LABELS,
} from '@/lib/api-client';

type TabKey = 'detay' | 'kadro' | 'sartlar' | 'belgeler' | 'sss';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'detay', label: 'İlan Detayı' },
  { key: 'kadro', label: 'Kadro Bilgileri' },
  { key: 'sartlar', label: 'Başvuru Şartları' },
  { key: 'belgeler', label: 'Gerekli Belgeler' },
  { key: 'sss', label: 'Sıkça Sorulan Sorular' },
];

function formatDate(value: string | null): string {
  if (!value) return 'Belirtilmemiş';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function InfoRow({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === '') return null;
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function JobDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [similarJobs, setSimilarJobs] = useState<JobPosting[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('detay');
  const [copyNotice, setCopyNotice] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isTogglingApplied, setIsTogglingApplied] = useState(false);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    favoritesApi
      .listIds(accessToken)
      .then((ids) => setIsFavorite(ids.includes(params.id)))
      .catch(() => undefined);
    applicationsApi
      .listIds(accessToken)
      .then((ids) => setIsApplied(ids.includes(params.id)))
      .catch(() => undefined);
  }, [accessToken, params.id]);

  const handleToggleFavorite = async () => {
    if (!accessToken || isTogglingFavorite) return;
    const next = !isFavorite;
    setIsFavorite(next);
    setIsTogglingFavorite(true);
    try {
      if (next) {
        await favoritesApi.add(params.id, accessToken);
      } else {
        await favoritesApi.remove(params.id, accessToken);
      }
    } catch {
      setIsFavorite(!next);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleToggleApplied = async () => {
    if (!accessToken || isTogglingApplied) return;
    const next = !isApplied;
    setIsApplied(next);
    setIsTogglingApplied(true);
    try {
      if (next) {
        await applicationsApi.add(params.id, accessToken);
      } else {
        await applicationsApi.remove(params.id, accessToken);
      }
    } catch {
      setIsApplied(!next);
    } finally {
      setIsTogglingApplied(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    jobPostingsApi
      .getById(params.id)
      .then(async (result) => {
        setJob(result);
        const similar = await jobPostingsApi.list({
          kpssScoreType: result.kpssScoreType ?? undefined,
          pageSize: 5,
        });
        setSimilarJobs(similar.items.filter((item) => item.id !== result.id).slice(0, 4));
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <Card>
        <p className="py-10 text-center text-sm text-slate-500">İlan bulunamadı.</p>
      </Card>
    );
  }

  const city = job.cityId ? cities.find((c) => c.id === job.cityId) : undefined;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-brand-600">
          Ana Sayfa
        </Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/ilanlar" className="hover:text-brand-600">
          Tüm İlanlar
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-700">İlan Detayı</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Building2 size={28} />
                </span>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{job.positionTitle}</h1>
                  <p className="mt-0.5 text-sm text-slate-500">{job.institutionName}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {city && <Badge variant="neutral">{city.name}</Badge>}
                    {job.kpssScoreType && <Badge variant="neutral">{job.kpssScoreType}</Badge>}
                    {job.minKpssScore !== null && (
                      <Badge variant="neutral">{job.minKpssScore} Puan</Badge>
                    )}
                    {job.minimumEducationLevel && (
                      <Badge variant="neutral">
                        {EDUCATION_LEVEL_LABELS[job.minimumEducationLevel]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                      isFavorite
                        ? 'border-danger-100 bg-danger-50 text-danger-600'
                        : 'border-slate-200 text-slate-400 hover:text-danger-600'
                    }`}
                    aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                  >
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <Button
                    variant={isApplied ? 'secondary' : 'outline'}
                    onClick={handleToggleApplied}
                    className="gap-2"
                  >
                    <ClipboardCheck size={16} />
                    {isApplied ? 'Başvurularımda' : 'Başvurularıma Ekle'}
                  </Button>
                  {job.hasPdf ? (
                    <a
                      href={`${API_BASE_URL}/job-postings/${job.id}/pdf`}
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
                  {job.applicationUrl ? (
                    <a href={job.applicationUrl} target="_blank" rel="noreferrer">
                      <Button>Başvuru Yap</Button>
                    </a>
                  ) : (
                    <Button disabled>Başvuru Linki Yok</Button>
                  )}
                </div>
                <div className="text-right text-xs text-slate-500">
                  {job.applicationStartDate && (
                    <p className="mb-1">
                      Başvuru Başlangıç:{' '}
                      <span className="font-semibold text-slate-900">
                        {formatDate(job.applicationStartDate)}
                      </span>
                    </p>
                  )}
                  <p>Son Başvuru Tarihi</p>
                  <p className="font-semibold text-slate-900">
                    {formatDate(job.applicationEndDate)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-0">
            <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'detay' && (
                <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                  <h3 className="text-base font-semibold text-slate-900">Genel Açıklama</h3>
                  <p>{job.description ?? 'Bu ilan için genel açıklama girilmemiş.'}</p>
                </div>
              )}

              {activeTab === 'kadro' && (
                <div className="divide-y divide-slate-100">
                  <InfoRow label="Kadro Unvanı" value={job.positionTitle} />
                  <InfoRow
                    label="Kurum Türü"
                    value={job.institutionType ? INSTITUTION_TYPE_LABELS[job.institutionType] : null}
                  />
                  <InfoRow
                    label="İlan Türü"
                    value={job.employmentType ? EMPLOYMENT_TYPE_LABELS[job.employmentType] : null}
                  />
                  <InfoRow label="Kadro Adedi" value={job.quotaCount} />
                  <InfoRow
                    label="Öğrenim Durumu"
                    value={
                      job.minimumEducationLevel
                        ? EDUCATION_LEVEL_LABELS[job.minimumEducationLevel]
                        : null
                    }
                  />
                  <InfoRow label="Çalışma Yeri" value={city?.name ?? null} />
                  <InfoRow
                    label="Başvuru Başlangıç Tarihi"
                    value={formatDate(job.applicationStartDate)}
                  />
                </div>
              )}

              {activeTab === 'sartlar' && (
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="divide-y divide-slate-100">
                    <InfoRow label="KPSS Puan Türü" value={job.kpssScoreType} />
                    <InfoRow label="KPSS Taban Puanı" value={job.minKpssScore} />
                    <InfoRow
                      label="Yaş Aralığı"
                      value={
                        job.minAge || job.maxAge
                          ? `${job.minAge ?? '-'} - ${job.maxAge ?? '-'}`
                          : null
                      }
                    />
                    <InfoRow
                      label="Deneyim Şartı"
                      value={job.requiresExperience ? 'Gerekli' : 'Gerekli değil'}
                    />
                  </div>
                  {job.qualificationCodes.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold text-slate-900">Nitelik Kodları</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.qualificationCodes.map((qc) => (
                          <Badge key={qc.code} variant="info">
                            {qc.code}
                            {qc.description ? ` — ${qc.description}` : ''}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.departments.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold text-slate-900">Kabul Edilen Bölümler</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.departments.map((department) => (
                          <Badge key={department} variant="neutral">
                            {department}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'belgeler' && (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-slate-600">
                    Gerekli belgeler ilana ve kuruma göre değişebilir. Güncel ve kesin belge listesi
                    için lütfen ilanın resmi başvuru sayfasını inceleyin.
                  </p>
                  {job.hasPdf && (
                    <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                      <FileText size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <p>
                        Yukarıdaki "İlan Metni (PDF)" butonu, kurumun yayınladığı ilan
                        metninin tarama sırasında alınmış bir arşiv kopyasıdır — resmi ve güncel
                        kaynak değildir. Son başvuru tarihi geçtikten sonra otomatik olarak
                        silinir.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sss' && (
                <p className="text-sm leading-relaxed text-slate-600">
                  Bu ilana özel sıkça sorulan bir soru bulunmuyor. Genel sorularınız için Yardım
                  Merkezi&apos;ni ziyaret edebilirsiniz.
                </p>
              )}
            </div>
          </Card>

          {similarJobs.length > 0 && (
            <Card>
              <h2 className="text-base font-semibold text-slate-900">Benzer İlanlar</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {similarJobs.map((similar) => (
                  <button
                    key={similar.id}
                    onClick={() => router.push(`/dashboard/ilanlar/${similar.id}`)}
                    className="rounded-xl border border-slate-100 p-4 text-left hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <p className="text-sm font-semibold text-slate-900">{similar.positionTitle}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{similar.institutionName}</p>
                    <p className="mt-2 text-xs font-medium text-slate-600">
                      {similar.kpssScoreType} · {formatDate(similar.applicationEndDate)}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-slate-900">Hızlı Bilgiler</h2>
            <div className="mt-3 divide-y divide-slate-100">
              <InfoRow
                label="Başvuru Başlangıç Tarihi"
                value={formatDate(job.applicationStartDate)}
              />
              <InfoRow label="Son Başvuru Tarihi" value={formatDate(job.applicationEndDate)} />
              <InfoRow label="Kadro Adedi" value={job.quotaCount} />
              <InfoRow label="KPSS Puan Türü" value={job.kpssScoreType} />
              <InfoRow label="KPSS Taban Puanı" value={job.minKpssScore} />
              <InfoRow
                label="Kurum Türü"
                value={job.institutionType ? INSTITUTION_TYPE_LABELS[job.institutionType] : null}
              />
              <InfoRow
                label="İlan Türü"
                value={job.employmentType ? EMPLOYMENT_TYPE_LABELS[job.employmentType] : null}
              />
            </div>
          </Card>

          <div className="rounded-2xl border border-warning-100 bg-warning-50 p-5">
            <div className="flex items-center gap-2 text-warning-700">
              <AlertTriangle size={18} />
              <h3 className="text-sm font-semibold">Önemli Notlar</h3>
            </div>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs leading-relaxed text-warning-700">
              <li>Başvuru şartlarını ve son başvuru tarihini dikkatle kontrol edin.</li>
              <li>Başvurular yalnızca ilanın resmi başvuru sayfası üzerinden yapılır.</li>
              <li>Gerçeğe aykırı beyanda bulunan adayların başvuruları geçersiz sayılabilir.</li>
            </ul>
          </div>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">Paylaş</h2>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl).catch(() => undefined);
                  setCopyNotice(true);
                  window.setTimeout(() => setCopyNotice(false), 2000);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="Bağlantıyı kopyala"
              >
                <Copy size={16} />
              </button>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(job.positionTitle)}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                aria-label="X'te paylaş"
              >
                𝕏
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700"
                aria-label="LinkedIn'de paylaş"
              >
                <Linkedin size={16} />
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${job.positionTitle} - ${shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-600 text-white hover:bg-success-700"
                aria-label="WhatsApp'ta paylaş"
              >
                W
              </a>
            </div>
            {copyNotice && <p className="mt-2 text-xs font-medium text-brand-600">Bağlantı kopyalandı.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <DashboardShell>
      <JobDetailContent />
    </DashboardShell>
  );
}
