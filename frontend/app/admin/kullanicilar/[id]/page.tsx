'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Loader2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import {
  adminUsersApi,
  AdminUserDetail,
  EDUCATION_LEVEL_LABELS,
  MILITARY_STATUS_LABELS,
} from '@/lib/api-client';

const ROLE_LABELS: Record<string, string> = {
  USER: 'Kullanıcı',
  MODERATOR: 'Moderatör',
  ADMIN: 'Yönetici',
};

const ACTION_LABELS: Record<string, string> = {
  USER_ROLE_CHANGED: 'Rol Değiştirildi',
  USER_SUSPENDED: 'Hesap Askıya Alındı',
  USER_REACTIVATED: 'Hesap Yeniden Aktif Edildi',
  USER_DELETED: 'Hesap Silindi',
  USER_RESTORED: 'Hesap Geri Getirildi',
  JOB_POSTING_APPROVED: 'İlan Onaylandı',
  JOB_POSTING_ARCHIVED: 'İlan Arşivlendi',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function UserDetailContent() {
  const { accessToken } = useAuth();
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !params.id) return;
    adminUsersApi
      .getById(params.id, accessToken)
      .then(setDetail)
      .finally(() => setIsLoading(false));
  }, [accessToken, params.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  if (!detail) {
    return <p className="py-20 text-center text-sm text-slate-500">Kullanıcı bulunamadı.</p>;
  }

  const { user, profile, matchSummary, recentAuditLogs } = detail;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/admin/kullanicilar" className="hover:text-brand-600">
          Kullanıcılar
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-700">{user.fullName}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={user.role === 'ADMIN' ? 'success' : 'neutral'}>
            {ROLE_LABELS[user.role] ?? user.role}
          </Badge>
          {user.isSuspended && <Badge variant="warning">Askıya Alındı</Badge>}
          {user.isDeleted && <Badge variant="danger">Silindi</Badge>}
          {!user.isSuspended && !user.isDeleted && <Badge variant="success">Aktif</Badge>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="text-base font-semibold text-slate-900">Hesap Bilgileri</h2>
            <div className="mt-3">
              <InfoRow label="E-posta" value={user.email} />
              <InfoRow label="Telefon" value={user.phone ?? 'Belirtilmemiş'} />
              <InfoRow label="E-posta Doğrulandı" value={user.isEmailVerified ? 'Evet' : 'Hayır'} />
              <InfoRow
                label="Kayıt Tarihi"
                value={new Date(user.createdAt).toLocaleDateString('tr-TR')}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">Profil ve KPSS Bilgileri</h2>
            {profile ? (
              <div className="mt-3">
                <InfoRow
                  label="Öğrenim Durumu"
                  value={
                    profile.educationLevel ? EDUCATION_LEVEL_LABELS[profile.educationLevel] : 'Belirtilmemiş'
                  }
                />
                <InfoRow label="Mezuniyet Okulu" value={profile.graduationSchool ?? 'Belirtilmemiş'} />
                <InfoRow
                  label="Mezuniyet Bölümü"
                  value={profile.graduationDepartmentName ?? 'Belirtilmemiş'}
                />
                <InfoRow
                  label="KPSS"
                  value={
                    profile.kpssScoreType && profile.kpssScore !== null
                      ? `${profile.kpssScoreType} - ${profile.kpssScore} (${profile.kpssYear ?? '-'})`
                      : 'Belirtilmemiş'
                  }
                />
                <InfoRow label="Ehliyet" value={profile.drivingLicense ? 'Var' : 'Yok'} />
                <InfoRow
                  label="Askerlik Durumu"
                  value={
                    profile.militaryStatus ? MILITARY_STATUS_LABELS[profile.militaryStatus] : 'Belirtilmemiş'
                  }
                />
                {profile.qualificationCodes.length > 0 && (
                  <div className="mt-3 border-t border-slate-50 pt-3">
                    <p className="mb-1.5 text-xs font-medium text-slate-500">Nitelik Kodları</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.qualificationCodes.map((qc) => (
                        <span
                          key={qc.code}
                          title={qc.description}
                          className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700"
                        >
                          {qc.code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Kullanıcı henüz profil bilgisi girmemiş.</p>
            )}
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">Bu Kullanıcıyla İlgili Kayıtlar</h2>
            {recentAuditLogs.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Kayıt bulunamadı.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {recentAuditLogs.map((log) => (
                  <li key={log.id} className="border-b border-slate-50 pb-3 text-sm last:border-0">
                    <div className="flex items-center justify-between">
                      <Badge variant="neutral">{ACTION_LABELS[log.action] ?? log.action}</Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Yapan: {log.actorFullName ?? log.actorEmail ?? 'Sistem'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-slate-900">Eşleştirme Özeti</h2>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Başvurulabilir</span>
                <span className="font-semibold text-success-700">{matchSummary.ELIGIBLE}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Bazı Şartlar Eksik</span>
                <span className="font-semibold text-warning-700">
                  {matchSummary.PARTIALLY_ELIGIBLE}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Başvurulamaz</span>
                <span className="font-semibold text-danger-600">{matchSummary.NOT_ELIGIBLE}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  return (
    <AdminShell>
      <UserDetailContent />
    </AdminShell>
  );
}
