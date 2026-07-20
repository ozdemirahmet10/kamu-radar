'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  BadgeCheck,
  Bell,
  Building2,
  Calendar,
  ChevronRight,
  Copy,
  Edit3,
  FileText,
  GraduationCap,
  Heart,
  ListChecks,
  Loader2,
  MapPin,
  Car,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { IconTile } from '@/components/ui/icon-tile';
import { DonutChart } from '@/components/ui/donut-chart';
import { useAuth } from '@/lib/auth-context';
import {
  applicationsApi,
  authApi,
  citiesApi,
  favoritesApi,
  matchesApi,
  notificationsApi,
  profileApi,
  ApplicationStats,
  City,
  ProfileResponse,
  EDUCATION_LEVEL_LABELS,
  MILITARY_STATUS_LABELS,
} from '@/lib/api-client';

const EMPTY_APPLICATION_STATS: ApplicationStats = {
  total: 0,
  documentsPending: 0,
  underReview: 0,
  interview: 0,
  accepted: 0,
  rejected: 0,
  successRate: 0,
};

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <IconTile icon={icon} color="info" size="sm" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ProfileOverviewContent() {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>(EMPTY_APPLICATION_STATS);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const handleResendVerification = async () => {
    if (!accessToken || isSendingVerification) return;
    setIsSendingVerification(true);
    setVerificationNotice(null);
    try {
      await authApi.resendVerification(accessToken);
      setVerificationNotice('Doğrulama e-postası gönderildi. Gelen kutunuzu kontrol edin.');
    } catch {
      setVerificationNotice('Gönderilemedi, lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsSendingVerification(false);
    }
  };

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    profileApi
      .getMine(accessToken)
      .then(setProfile)
      .finally(() => setIsLoading(false));

    applicationsApi
      .list({ page: 1, pageSize: 1 }, accessToken)
      .then((result) => setApplicationStats(result.stats))
      .catch(() => undefined);

    favoritesApi
      .list({ page: 1, pageSize: 1 }, accessToken)
      .then((result) => setFavoriteCount(result.totalCount))
      .catch(() => undefined);

    notificationsApi
      .list({ page: 1, pageSize: 1 }, accessToken)
      .then((result) => setNotificationCount(result.totalCount))
      .catch(() => undefined);

    matchesApi
      .list({ statuses: ['ELIGIBLE'], page: 1, pageSize: 1 }, accessToken)
      .then((result) => setEligibleCount(result.totalCount))
      .catch(() => undefined);
  }, [accessToken]);

  if (isLoading || !user) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  const preferredCityNames = profile?.preferredCityIds
    .map((id) => cities.find((city) => city.id === id)?.name)
    .filter(Boolean) as string[] | undefined;

  const kpssLabel =
    profile?.kpssScoreType && profile.kpssScore !== null
      ? `${profile.kpssScoreType} - ${profile.kpssScore}`
      : 'Belirtilmemiş';

  const memberSince = new Date(user.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profilim</h1>
          <nav className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/dashboard" className="hover:text-brand-600">
              Ana Sayfa
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-700">Profilim</span>
          </nav>
        </div>
        <Link href="/dashboard/profil/duzenle">
          <Button variant="outline" className="gap-2">
            <Edit3 size={16} />
            Profili Düzenle
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Avatar fullName={user.fullName} size="lg" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
                {user.isEmailVerified && <BadgeCheck size={18} className="text-brand-600" />}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="info">Kamu Personeli Adayı</Badge>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar size={13} />
                  Üye Olduğu Tarih: {memberSince}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <IconTile icon={<FileText size={18} />} color="info" />
              <span className="text-lg font-bold text-slate-900">{applicationStats.total}</span>
              <span className="text-xs text-slate-500">Başvuru</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <IconTile icon={<Heart size={18} />} color="success" />
              <span className="text-lg font-bold text-slate-900">{favoriteCount}</span>
              <span className="text-xs text-slate-500">Favori İlan</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <IconTile icon={<Bell size={18} />} color="warning" />
              <span className="text-lg font-bold text-slate-900">{notificationCount}</span>
              <span className="text-xs text-slate-500">Bildirim</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <IconTile icon={<ListChecks size={18} />} color="accent" />
              <span className="text-lg font-bold text-slate-900">{eligibleCount}</span>
              <span className="text-xs text-slate-500">Uygun İlan</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-slate-900">Hızlı Bilgiler</h2>
            <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3">
              <InfoTile
                icon={<GraduationCap size={18} />}
                label="Öğrenim Durumu"
                value={profile?.educationLevel ? EDUCATION_LEVEL_LABELS[profile.educationLevel] : 'Belirtilmemiş'}
              />
              <InfoTile icon={<Award size={18} />} label="KPSS Puanı" value={kpssLabel} />
              <InfoTile
                icon={<Car size={18} />}
                label="Ehliyet Durumu"
                value={profile?.drivingLicense ? 'Var' : 'Yok'}
              />
              <InfoTile
                icon={<Building2 size={18} />}
                label="Askerlik Durumu"
                value={profile?.militaryStatus ? MILITARY_STATUS_LABELS[profile.militaryStatus] : 'Belirtilmemiş'}
              />
              <InfoTile
                icon={<MapPin size={18} />}
                label="Tercih Ettiği Şehirler"
                value={preferredCityNames?.length ? preferredCityNames.join(', ') : 'Belirtilmemiş'}
              />
            </div>

            {profile?.graduationDepartmentName && profile.qualificationCodes.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Nitelik Kodlarınız:</span>
                  {profile.qualificationCodes.map((qc) => (
                    <span
                      key={qc.code}
                      title={qc.description}
                      className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700"
                    >
                      {qc.code}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">KPSS Bilgilerim</h2>
              <Link
                href="/dashboard/profil/duzenle"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Detayları Gör →
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-lg font-bold text-slate-900">
                  {profile?.kpssScoreType ?? '-'}
                </p>
                <p className="text-xs text-slate-500">Puan Türü</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-lg font-bold text-slate-900">{profile?.kpssScore ?? '-'}</p>
                <p className="text-xs text-slate-500">KPSS Puanı</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-lg font-bold text-slate-900">{profile?.kpssYear ?? '-'}</p>
                <p className="text-xs text-slate-500">Sınav Yılı</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Kariyer Özeti</h2>
              <Link
                href="/dashboard/basvurularim"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Tümünü Gör →
              </Link>
            </div>
            {applicationStats.total === 0 ? (
              <p className="mt-4 text-sm text-slate-400">
                Henüz takip ettiğiniz bir başvuru yok. İlan detay sayfasındaki
                &quot;Başvurularıma Ekle&quot; butonuyla başvurularınızı takip edebilirsiniz.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-8">
                <DonutChart
                  centerValue={applicationStats.total}
                  centerLabel="Toplam"
                  segments={[
                    {
                      value: applicationStats.documentsPending + applicationStats.underReview,
                      colorClassName: 'text-brand-500',
                    },
                    { value: applicationStats.interview, colorClassName: 'text-success-600' },
                    { value: applicationStats.accepted, colorClassName: 'text-warning-600' },
                    { value: applicationStats.rejected, colorClassName: 'text-accent-600' },
                  ]}
                />
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                    <span className="font-semibold text-slate-900">
                      {applicationStats.documentsPending + applicationStats.underReview}
                    </span>
                    <span className="text-slate-500">Devam Eden Başvuru</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-success-600" />
                    <span className="font-semibold text-slate-900">
                      {applicationStats.interview}
                    </span>
                    <span className="text-slate-500">Görüşme Aşamasında</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-warning-600" />
                    <span className="font-semibold text-slate-900">
                      {applicationStats.accepted}
                    </span>
                    <span className="text-slate-500">Sonuçlanan Başvuru</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent-600" />
                    <span className="font-semibold text-slate-900">
                      {applicationStats.rejected}
                    </span>
                    <span className="text-slate-500">Reddedilen Başvuru</span>
                  </li>
                </ul>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-slate-900">İletişim Bilgilerim</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-slate-700">{user.email}</span>
                <Badge variant={user.isEmailVerified ? 'success' : 'neutral'}>
                  {user.isEmailVerified ? 'Doğrulandı ✓' : 'Doğrulanmadı'}
                </Badge>
              </div>
              {!user.isEmailVerified && (
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isSendingVerification}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-60"
                  >
                    {isSendingVerification ? 'Gönderiliyor...' : 'Doğrulama e-postası gönder'}
                  </button>
                  {verificationNotice && (
                    <p className="mt-1 text-xs text-slate-500">{verificationNotice}</p>
                  )}
                </div>
              )}
              {user.phone && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-700">{user.phone}</span>
                </div>
              )}
            </div>
            <Link href="/dashboard/ayarlar">
              <Button variant="outline" className="mt-4 w-full justify-center gap-2">
                İletişim Bilgilerini Düzenle
                <ChevronRight size={16} />
              </Button>
            </Link>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Tercih Ettiğiniz Şehirler</h2>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText((preferredCityNames ?? []).join(', ')).catch(() => undefined);
                }}
                className="text-slate-300 hover:text-brand-600"
                aria-label="Kopyala"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {preferredCityNames?.length ? (
                preferredCityNames.map((name) => (
                  <Badge key={name} variant="neutral">
                    {name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-400">Henüz şehir tercihi eklenmedi.</p>
              )}
            </div>
            <Link href="/dashboard/profil/duzenle">
              <Button variant="outline" className="mt-4 w-full justify-center gap-2">
                Şehir Tercihlerini Düzenle
                <ChevronRight size={16} />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProfileOverviewPage() {
  return (
    <DashboardShell>
      <ProfileOverviewContent />
    </DashboardShell>
  );
}
