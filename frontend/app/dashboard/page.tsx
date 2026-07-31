'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Bookmark,
  Building2,
  CalendarClock,
  ChevronRight,
  Lightbulb,
  ListChecks,
  Loader2,
  Megaphone,
  Sparkles,
  X,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/progress-ring';
import { StatCard } from '@/components/dashboard/stat-card';
import { JobPostingCard } from '@/components/dashboard/job-posting-card';
import { useAuth } from '@/lib/auth-context';
import {
  citiesApi,
  favoritesApi,
  institutionsApi,
  jobPostingsApi,
  matchesApi,
  profileApi,
  radarInsightApi,
  City,
  EligibilityStatus,
  Institution,
  JobPosting,
  MatchedJobPosting,
  ProfileResponse,
} from '@/lib/api-client';

const today = new Date().toLocaleDateString('tr-TR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const EMPTY_STATUS_COUNTS: Record<EligibilityStatus, number> = {
  ELIGIBLE: 0,
  PARTIALLY_ELIGIBLE: 0,
  NOT_ELIGIBLE: 0,
};

interface ProfileTip {
  title: string;
  description: string;
  href: string;
}

function buildProfileTips(profile: ProfileResponse | null, partiallyEligibleCount: number): ProfileTip[] {
  const tips: ProfileTip[] = [];

  if (partiallyEligibleCount > 0) {
    tips.push({
      title: `${partiallyEligibleCount} ilan sadece profil eksikliği yüzünden kısmi uygun görünüyor`,
      description:
        'Profilini tamamlarsan bu ilanlarda tam uygunluk kazanıp "Bana Uygun İlanlar" sayfasında görebilirsin. Şimdilik Tüm İlanlar sayfasından inceleyebilirsin.',
      href: '/dashboard/ilanlar',
    });
  }
  if (!profile?.kpssScoreType || profile.kpssScore === null) {
    tips.push({
      title: 'KPSS puanını gir',
      description: 'Puanını girmeden ilanlara ne kadar uygun olduğunu hesaplayamayız.',
      href: '/dashboard/profil/duzenle',
    });
  }
  if (!profile?.educationLevel || !profile.graduationDepartmentId) {
    tips.push({
      title: 'Mezuniyet bilgilerini tamamla',
      description: 'Öğrenim seviyesi ve bölüm bilgisi, nitelik kodu kontrolü için gerekli.',
      href: '/dashboard/profil/duzenle',
    });
  }
  if (!profile?.birthDate) {
    tips.push({
      title: 'Doğum tarihini ekle',
      description: 'Yaş şartı olan ilanları değerlendirebilmemiz için gerekli.',
      href: '/dashboard/profil/duzenle',
    });
  }
  if (!profile?.preferredCityIds.length) {
    tips.push({
      title: 'Tercih ettiğin şehirleri seç',
      description: 'İlan sıralamasında şehir tercihini dikkate alabilmemiz için gerekli.',
      href: '/dashboard/profil/duzenle',
    });
  }

  return tips.slice(0, 3);
}

/**
 * Profildeki, eşleştirme motorunun gerçekten kullandığı alanların (doğum
 * tarihi, öğrenim seviyesi, mezuniyet bölümü, KPSS puanı, şehir tercihi) doluluk
 * oranına göre 0-100 arası bir skor hesaplar. Ne kadar yüksekse, eşleştirme
 * sonuçları o kadar isabetli olur.
 */
function computeProfileScore(profile: ProfileResponse | null): number {
  if (!profile) return 0;
  const checks = [
    Boolean(profile.birthDate),
    Boolean(profile.educationLevel),
    Boolean(profile.graduationDepartmentId),
    Boolean(profile.kpssScoreType && profile.kpssScore !== null && profile.kpssYear),
    profile.preferredCityIds.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

function DashboardContent() {
  const { user, accessToken } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [matches, setMatches] = useState<MatchedJobPosting[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<EligibilityStatus, number>>(EMPTY_STATUS_COUNTS);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [addedTodayCount, setAddedTodayCount] = useState(0);
  const [deadlineSoonCount, setDeadlineSoonCount] = useState(0);
  const [institutionSuggestions, setInstitutionSuggestions] = useState<Institution[]>([]);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isRadarLoading, setIsRadarLoading] = useState(false);
  const [radarInsight, setRadarInsight] = useState<string | null>(null);
  const [radarError, setRadarError] = useState<string | null>(null);

  const cityMap = useMemo(() => new Map(cities.map((city) => [city.id, city])), [cities]);

  const handleOpenRadarInsight = async () => {
    setIsRadarOpen(true);
    if (!accessToken || isRadarLoading) return;
    setIsRadarLoading(true);
    setRadarError(null);
    try {
      const result = await radarInsightApi.get(accessToken);
      setRadarInsight(result.insight);
    } catch {
      setRadarError('İçgörü oluşturulamadı, lütfen tekrar deneyin.');
    } finally {
      setIsRadarLoading(false);
    }
  };

  const handleFavoriteChange = (jobPostingId: string, isFavorite: boolean) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.add(jobPostingId);
      else next.delete(jobPostingId);
      return next;
    });
  };

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => undefined);
    jobPostingsApi
      .list({ pageSize: 20 })
      .then((result) => setJobs(result.items))
      .catch(() => undefined)
      .finally(() => setIsLoadingJobs(false));
    institutionsApi
      .list({ sortBy: 'activeCount', pageSize: 5 })
      .then((result) => setInstitutionSuggestions(result.items))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    matchesApi
      .list({ pageSize: 50 }, accessToken)
      .then((result) => {
        setMatches(result.items);
        setStatusCounts(result.statusCounts);
      })
      .catch(() => undefined);
    profileApi.getMine(accessToken).then(setProfile).catch(() => undefined);
    favoritesApi
      .listIds(accessToken)
      .then((ids) => setFavoriteIds(new Set(ids)))
      .catch(() => undefined);

    // Kartlardaki sayılar, tıklandıklarında gidilen /dashboard/ilanlar sayfasıyla birebir
    // tutarlı olsun diye o sayfanın kullandığı aynı filtrelerle (matchesApi + totalCount)
    // hesaplanır — "jobs" listesindeki son 20 ilanla sınırlı bir tahmin değil, gerçek sayı.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    matchesApi
      .list({ createdAfter: todayStart.toISOString(), pageSize: 1 }, accessToken)
      .then((result) => setAddedTodayCount(result.totalCount))
      .catch(() => undefined);
    matchesApi
      .list({ deadlineWithinDays: 3, pageSize: 1 }, accessToken)
      .then((result) => setDeadlineSoonCount(result.totalCount))
      .catch(() => undefined);
  }, [accessToken]);

  const matchingCount = statusCounts.ELIGIBLE;

  const liveStats = useMemo(
    () => ({ addedToday: addedTodayCount, deadlineSoon: deadlineSoonCount }),
    [addedTodayCount, deadlineSoonCount],
  );

  const upcomingDeadlines = useMemo(() => {
    return matches
      .filter((m) => m.jobPosting.applicationEndDate)
      .sort(
        (a, b) =>
          new Date(a.jobPosting.applicationEndDate!).getTime() -
          new Date(b.jobPosting.applicationEndDate!).getTime(),
      )
      .slice(0, 4);
  }, [matches]);

  const recentSystemActivity = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [jobs]);

  const profileTips = useMemo(
    () => buildProfileTips(profile, statusCounts.PARTIALLY_ELIGIBLE),
    [profile, statusCounts],
  );

  const profileScore = useMemo(() => computeProfileScore(profile), [profile]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hoş geldin, {user?.fullName.split(' ')[0]}! 👋
          </h1>
          <p className="mt-1 text-sm capitalize text-slate-500">Bugün {today}</p>
        </div>
        <Button className="gap-2" onClick={handleOpenRadarInsight}>
          <Sparkles size={18} />
          Radar AI
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={<ListChecks size={20} />}
          color="success"
          value={matchingCount}
          label="Sana Uygun İlan"
          href="/dashboard/uygun-ilanlar"
        />
        <StatCard
          icon={<CalendarClock size={20} />}
          color="info"
          value={liveStats.addedToday}
          label="Bugün Eklenen"
          href="/dashboard/ilanlar?createdToday=1"
        />
        <StatCard
          icon={<Bell size={20} />}
          color="warning"
          value={liveStats.deadlineSoon}
          label="Son Başvuru Yaklaşan"
          href="/dashboard/ilanlar?deadlineDays=3"
        />
        <StatCard
          icon={<Bookmark size={20} />}
          color="accent"
          value={favoriteIds.size}
          label="Favori İlan"
          href="/dashboard/favoriler"
        />
        <Card className="col-span-2 flex flex-col items-center justify-center gap-2 lg:col-span-1">
          <ProgressRing value={profileScore} />
          <Link href="/dashboard/profil/duzenle" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            Skorunu Yükselt →
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Son Eklenen İlanlar</h2>
            <Link href="/dashboard/ilanlar" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Tümünü Gör →
            </Link>
          </div>
          <div className="mt-2">
            {isLoadingJobs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-brand-600" size={22} />
              </div>
            ) : jobs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Henüz ilan bulunmuyor.</p>
            ) : (
              jobs
                .slice(0, 3)
                .map((job) => (
                  <JobPostingCard
                    key={job.id}
                    job={job}
                    city={job.cityId ? cityMap.get(job.cityId) : undefined}
                    isFavorite={favoriteIds.has(job.id)}
                    onFavoriteChange={handleFavoriteChange}
                  />
                ))
            )}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-1">
          <Card>
            <h2 className="text-base font-semibold text-slate-900">Günlük Özet</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CalendarClock size={16} className="mt-0.5 shrink-0 text-brand-500" />
                Bugün {liveStats.addedToday} yeni ilan eklendi.
              </li>
              <li className="flex items-start gap-2.5">
                <Bell size={16} className="mt-0.5 shrink-0 text-brand-500" />
                {liveStats.deadlineSoon > 0
                  ? `${liveStats.deadlineSoon} ilanın son başvuru tarihi yaklaşıyor.`
                  : 'Yaklaşan bir son başvuru tarihi bulunmuyor.'}
              </li>
              <li className="flex items-start gap-2.5">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-500" />
                {statusCounts.PARTIALLY_ELIGIBLE > 0
                  ? `Profilini tamamlarsan ${statusCounts.PARTIALLY_ELIGIBLE} ilana daha kesin uygun olabilirsin.`
                  : 'Profilin eksiksiz görünüyor, en iyi eşleşmeleri görüyorsun.'}
              </li>
            </ul>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Önemli Tarihler</h2>
              <Link href="/dashboard/ilanlar" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Tümünü Gör →
              </Link>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">
                Uygun olduğun ilanlar arasında yaklaşan bir son başvuru tarihi yok.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {upcomingDeadlines.map((match) => {
                  const date = new Date(match.jobPosting.applicationEndDate!);
                  return (
                    <li key={match.jobPosting.id} className="flex items-center gap-3">
                      <div className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-slate-50 py-1.5">
                        <span className="text-sm font-bold text-slate-900">{date.getDate()}</span>
                        <span className="text-[10px] text-slate-500">
                          {date.toLocaleDateString('tr-TR', { month: 'long' })}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {match.jobPosting.institutionName}
                        </p>
                        <p className="text-xs text-slate-500">{match.jobPosting.positionTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Son Başvuru</p>
                        <p className="text-xs font-semibold text-slate-700">
                          {date.toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card>
            <h2 className="text-base font-semibold text-slate-900">Öneriler</h2>
            {profileTips.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">
                Şu anda öne çıkan bir öneri yok — profilin ve eşleşmelerin iyi durumda.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {profileTips.map((tip) => (
                  <li key={tip.title}>
                    <Link
                      href={tip.href}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                          <Lightbulb size={16} />
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-slate-900">
                            {tip.title}
                          </span>
                          <span className="block text-xs text-slate-500">{tip.description}</span>
                        </span>
                      </span>
                      <ChevronRight size={16} className="shrink-0 text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">Sistem Aktivitesi</h2>
            {recentSystemActivity.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">Henüz bir aktivite bulunmuyor.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {recentSystemActivity.map((job) => (
                  <li key={job.id} className="flex items-start gap-3">
                    <span className="mt-0.5">
                      <Megaphone size={16} className="text-brand-600" />
                    </span>
                    <div>
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">{job.institutionName}</span> yeni bir ilan
                        yayınladı: {job.positionTitle}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Sana Özel Önerilen Kurumlar</h2>
          <Link href="/dashboard/kurumlar" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            Tüm Kurumları Gör →
          </Link>
        </div>
        {institutionSuggestions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Henüz gösterilecek kurum bulunmuyor.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {institutionSuggestions.map((institution) => (
              <Link
                key={institution.institutionName}
                href={`/dashboard/ilanlar?institution=${encodeURIComponent(institution.institutionName)}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 text-center transition-colors hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Building2 size={18} />
                </span>
                <p className="line-clamp-2 text-xs font-semibold text-slate-900">
                  {institution.institutionName}
                </p>
                <p className="text-xs text-slate-500">{institution.activeJobPostingCount} açık ilan</p>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {isRadarOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setIsRadarOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Sparkles size={18} className="text-brand-600" />
                Radar AI
              </h2>
              <button
                type="button"
                onClick={() => setIsRadarOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              {isRadarLoading ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Loader2 className="animate-spin text-brand-600" size={24} />
                  <p className="text-xs text-slate-500">Profiliniz değerlendiriliyor...</p>
                </div>
              ) : radarError ? (
                <p className="py-4 text-sm text-danger-600">{radarError}</p>
              ) : (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {radarInsight}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardContent />
    </DashboardShell>
  );
}
