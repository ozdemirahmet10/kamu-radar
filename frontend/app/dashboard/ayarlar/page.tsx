'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Laptop,
  Loader2,
  Settings,
  Smartphone,
  Trash2,
  User,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import {
  ApiError,
  authApi,
  notificationPreferenceApi,
  sessionsApi,
  DigestFrequency,
  SecurityHistoryItem,
  Session,
} from '@/lib/api-client';
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushSubscriptionStatus,
  isPushSupported,
} from '@/lib/push-notifications';

function parseDeviceInfo(userAgent: string | null): { label: string; isMobile: boolean } {
  if (!userAgent) return { label: 'Bilinmeyen cihaz', isMobile: false };

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

  let browser = 'Bilinmeyen tarayıcı';
  if (userAgent.includes('Edg/')) browser = 'Edge';
  else if (userAgent.includes('Chrome/')) browser = 'Chrome';
  else if (userAgent.includes('Firefox/')) browser = 'Firefox';
  else if (userAgent.includes('Safari/')) browser = 'Safari';

  let os = '';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  else if (userAgent.includes('Linux')) os = 'Linux';

  return { label: os ? `${browser} · ${os}` : browser, isMobile };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SettingsContent() {
  const { accessToken, user, logout } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountNotice, setAccountNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailDigestFrequency, setEmailDigestFrequency] = useState<DigestFrequency>('INSTANT');
  const [isLoadingPreference, setIsLoadingPreference] = useState(true);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [isSavingEmailPreference, setIsSavingEmailPreference] = useState(false);
  const [isSavingDigestFrequency, setIsSavingDigestFrequency] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const [isSavingPush, setIsSavingPush] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const [revokeOthersNotice, setRevokeOthersNotice] = useState<string | null>(null);

  const [securityHistory, setSecurityHistory] = useState<SecurityHistoryItem[]>([]);
  const [isLoadingSecurityHistory, setIsLoadingSecurityHistory] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone ?? '');
    }
  }, [user]);

  useEffect(() => {
    setPushSupported(isPushSupported());
    getPushSubscriptionStatus()
      .then(setPushEnabled)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    notificationPreferenceApi
      .get(accessToken)
      .then((result) => {
        setInAppEnabled(result.inAppEnabled);
        setEmailEnabled(result.emailEnabled);
        setEmailDigestFrequency(result.emailDigestFrequency);
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingPreference(false));

    sessionsApi
      .list(accessToken)
      .then(setSessions)
      .catch(() => undefined)
      .finally(() => setIsLoadingSessions(false));

    authApi
      .getSecurityHistory({ pageSize: 10 }, accessToken)
      .then((result) => setSecurityHistory(result.items))
      .catch(() => undefined)
      .finally(() => setIsLoadingSecurityHistory(false));
  }, [accessToken]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setAccountNotice(null);
    setIsSavingAccount(true);
    try {
      await authApi.updateAccount({ fullName, phone: phone || undefined }, accessToken);
      setAccountNotice({ type: 'success', message: 'Hesap bilgileriniz güncellendi.' });
    } catch (err) {
      setAccountNotice({
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Güncellenemedi, tekrar deneyin.',
      });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setPasswordNotice(null);

    if (newPassword !== newPasswordConfirm) {
      setPasswordNotice({ type: 'error', message: 'Yeni şifreler birbiriyle eşleşmiyor.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordNotice({ type: 'error', message: 'Yeni şifre en az 8 karakter olmalı.' });
      return;
    }

    setIsSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword }, accessToken);
      setPasswordNotice({ type: 'success', message: 'Şifreniz başarıyla güncellendi.' });
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      setPasswordNotice({
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Şifre güncellenemedi, tekrar deneyin.',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleToggleInApp = async () => {
    if (!accessToken || isSavingPreference) return;
    const next = !inAppEnabled;
    setInAppEnabled(next);
    setIsSavingPreference(true);
    try {
      await notificationPreferenceApi.update({ inAppEnabled: next }, accessToken);
    } catch {
      setInAppEnabled(!next);
    } finally {
      setIsSavingPreference(false);
    }
  };

  const handleToggleEmail = async () => {
    if (!accessToken || isSavingEmailPreference) return;
    const next = !emailEnabled;
    setEmailEnabled(next);
    setIsSavingEmailPreference(true);
    try {
      await notificationPreferenceApi.update({ emailEnabled: next }, accessToken);
    } catch {
      setEmailEnabled(!next);
    } finally {
      setIsSavingEmailPreference(false);
    }
  };

  const handleChangeDigestFrequency = async (next: DigestFrequency) => {
    if (!accessToken || isSavingDigestFrequency) return;
    const previous = emailDigestFrequency;
    setEmailDigestFrequency(next);
    setIsSavingDigestFrequency(true);
    try {
      await notificationPreferenceApi.update({ emailDigestFrequency: next }, accessToken);
    } catch {
      setEmailDigestFrequency(previous);
    } finally {
      setIsSavingDigestFrequency(false);
    }
  };

  const handleTogglePush = async () => {
    if (!accessToken || isSavingPush) return;
    setPushError(null);
    setIsSavingPush(true);
    try {
      if (pushEnabled) {
        await disablePushNotifications(accessToken);
        setPushEnabled(false);
      } else {
        await enablePushNotifications(accessToken);
        setPushEnabled(true);
      }
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'İşlem gerçekleştirilemedi.');
    } finally {
      setIsSavingPush(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!accessToken) return;
    setRevokingSessionId(sessionId);
    try {
      await sessionsApi.revoke(sessionId, accessToken);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      // sessizce yok say — kullanıcı listeyi yeniden yükleyerek tekrar deneyebilir
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!accessToken || isRevokingOthers) return;
    setIsRevokingOthers(true);
    setRevokeOthersNotice(null);
    try {
      const { revokedCount } = await sessionsApi.revokeOthers(accessToken);
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setRevokeOthersNotice(
        revokedCount > 0
          ? `${revokedCount} oturum sonlandırıldı.`
          : 'Sonlandırılacak başka oturum yoktu.',
      );
    } catch {
      setRevokeOthersNotice('İşlem başarısız oldu, tekrar deneyin.');
    } finally {
      setIsRevokingOthers(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || isDeletingAccount) return;
    setDeleteError(null);
    setIsDeletingAccount(true);
    try {
      await authApi.deleteAccount(deletePassword, accessToken);
      await logout();
      router.push('/login');
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Hesap silinemedi, tekrar deneyin.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Settings className="text-brand-600" size={22} />
          Ayarlar
        </h1>
        <p className="mt-1 text-sm text-slate-500">Hesap, güvenlik ve bildirim ayarlarınızı yönetin.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <User size={18} className="text-brand-600" />
              Hesap Bilgileri
            </h2>
            <form onSubmit={handleSaveAccount} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Ad Soyad"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Telefon"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="5XX XXX XX XX"
                />
              </div>
              <Input label="E-posta" value={user?.email ?? ''} disabled />

              {accountNotice && (
                <p
                  className={`text-sm font-medium ${
                    accountNotice.type === 'success' ? 'text-success-700' : 'text-danger-600'
                  }`}
                >
                  {accountNotice.message}
                </p>
              )}

              <Button type="submit" isLoading={isSavingAccount}>
                Bilgileri Kaydet
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <KeyRound size={18} className="text-brand-600" />
              Şifre Değiştir
            </h2>
            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <Input
                label="Mevcut Şifre"
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Yeni Şifre"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <Input
                  label="Yeni Şifre (Tekrar)"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => !prev)}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label={showPasswords ? 'Şifreleri gizle' : 'Şifreleri göster'}
                    >
                      {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>

              {passwordNotice && (
                <p
                  className={`text-sm font-medium ${
                    passwordNotice.type === 'success' ? 'text-success-700' : 'text-danger-600'
                  }`}
                >
                  {passwordNotice.message}
                </p>
              )}

              <Button type="submit" isLoading={isSavingPassword}>
                Şifreyi Güncelle
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Bell size={18} className="text-brand-600" />
              Bildirim Tercihleri
            </h2>
            {isLoadingPreference ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-brand-600" size={20} />
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">Uygulama İçi Bildirimler</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Yeni uygun ilan ve yaklaşan son başvuru tarihi bildirimlerini alın.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleInApp}
                  role="switch"
                  aria-checked={inAppEnabled}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    inAppEnabled ? 'bg-brand-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      inAppEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            )}

            {!isLoadingPreference && (
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">E-posta Bildirimleri</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Uygulama içi bildirimler kapalıyken e-posta da gönderilmez.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleEmail}
                  role="switch"
                  aria-checked={emailEnabled}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    emailEnabled ? 'bg-brand-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      emailEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            )}

            {!isLoadingPreference && emailEnabled && (
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">E-posta Sıklığı</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Anlık: her bildirim ayrı e-posta. Günlük özet: gün içindeki tüm bildirimler tek e-postada.
                  </p>
                </div>
                <select
                  value={emailDigestFrequency}
                  onChange={(e) => handleChangeDigestFrequency(e.target.value as DigestFrequency)}
                  disabled={isSavingDigestFrequency}
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
                >
                  <option value="INSTANT">Anlık</option>
                  <option value="DAILY">Günlük Özet</option>
                </select>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Tarayıcı Bildirimleri</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {pushSupported
                    ? 'Uygulamayı kapatsanız bile bu tarayıcıda anlık bildirim alın.'
                    : 'Bu tarayıcı push bildirimlerini desteklemiyor.'}
                </p>
                {pushError && <p className="mt-1 text-xs font-medium text-danger-600">{pushError}</p>}
              </div>
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={!pushSupported || isSavingPush}
                role="switch"
                aria-checked={pushEnabled}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                  pushEnabled ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    pushEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Oturumlar</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Hesabınıza giriş yapılmış aktif cihazlar. Tanımadığınız bir oturum görürseniz
                  sonlandırın.
                </p>
              </div>
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={handleRevokeOtherSessions}
                  disabled={isRevokingOthers}
                  className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  {isRevokingOthers ? 'Sonlandırılıyor...' : 'Tüm Diğer Cihazlardan Çıkış Yap'}
                </button>
              )}
            </div>
            {revokeOthersNotice && (
              <p className="mt-2 text-xs font-medium text-slate-500">{revokeOthersNotice}</p>
            )}
            {isLoadingSessions ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-brand-600" size={20} />
              </div>
            ) : sessions.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">Aktif oturum bulunamadı.</p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {sessions.map((session) => {
                  const device = parseDeviceInfo(session.deviceInfo);
                  const Icon = device.isMobile ? Smartphone : Laptop;
                  return (
                    <div key={session.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <Icon size={16} />
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-900">{device.label}</p>
                            {session.isCurrent && <Badge variant="success">Bu cihaz</Badge>}
                          </div>
                          <p className="text-xs text-slate-400">
                            Giriş: {formatDateTime(session.createdAt)}
                          </p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingSessionId === session.id}
                          className="shrink-0 text-xs font-semibold text-danger-600 hover:text-danger-700 disabled:opacity-50"
                        >
                          {revokingSessionId === session.id ? 'Sonlandırılıyor...' : 'Sonlandır'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <History size={18} className="text-brand-600" />
              Hesap Güvenlik Geçmişi
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Hesabınızla ilgili son güvenlik olayları (giriş, şifre değişikliği, vb.).
            </p>
            {isLoadingSecurityHistory ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-brand-600" size={20} />
              </div>
            ) : securityHistory.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">Henüz bir kayıt bulunmuyor.</p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {securityHistory.map((item) => (
                  <div key={item.id} className="py-2.5">
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(item.createdAt)}
                      {item.deviceInfo ? ` · ${parseDeviceInfo(item.deviceInfo).label}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="border-danger-100">
            <h2 className="flex items-center gap-2 text-base font-semibold text-danger-700">
              <Trash2 size={18} />
              Hesabımı Sil
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Hesabınızı ve tüm verilerinizi kalıcı olarak silin. Bu işlem geri alınamaz.
            </p>

            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4 border-danger-200 text-danger-600 hover:bg-danger-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Hesabımı Sil
              </Button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="mt-4 space-y-3">
                <p className="text-sm font-medium text-danger-700">
                  Onaylamak için şifrenizi girin. Bu işlem geri alınamaz.
                </p>
                <Input
                  label="Şifreniz"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                {deleteError && (
                  <p className="text-sm font-medium text-danger-600">{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="border-danger-200 bg-danger-600 text-white hover:bg-danger-700"
                    isLoading={isDeletingAccount}
                  >
                    Hesabımı Kalıcı Olarak Sil
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                      setDeleteError(null);
                    }}
                  >
                    Vazgeç
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DashboardShell>
      <SettingsContent />
    </DashboardShell>
  );
}
