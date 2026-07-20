'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, BarChart3, Eye, EyeOff, Lock, ShieldCheck, Target } from 'lucide-react';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ApiError, authApi } from '@/lib/api-client';

const FEATURES = [
  {
    icon: <Target size={18} />,
    title: 'Kişiselleştirilmiş İlanlar',
    description: 'Profilinize uygun ilanları kaçırmayın.',
  },
  {
    icon: <Bell size={18} />,
    title: 'Anında Bildirim',
    description: 'Yeni ilanlardan anında haberdar olun.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Güvenli ve Hızlı',
    description: '256-bit SSL ile verileriniz güvende.',
  },
  {
    icon: <BarChart3 size={18} />,
    title: 'Akıllı Analiz',
    description: 'Radar skorunuzla başarı ihtimalinizi artırın.',
  },
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== newPasswordConfirm) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setIsSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Şifre sıfırlanamadı, tekrar deneyin.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      headline={
        <>
          Yeni şifrenizi
          <br />
          belirleyin.
        </>
      }
      description="Hesabınız için güçlü, en az 8 karakterli yeni bir şifre belirleyin."
      features={FEATURES}
    >
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-3xl font-bold text-slate-900">Yeni Şifre Belirle</h1>
        <p className="mt-2 text-sm text-slate-500">
          Hesabınız için yeni bir şifre girin.
        </p>

        {!token ? (
          <p className="mt-8 rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
            Geçersiz bağlantı. Lütfen e-postanızdaki bağlantıyı tekrar kontrol edin.
          </p>
        ) : isSuccess ? (
          <p className="mt-8 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-700">
            Şifreniz güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="Yeni Şifre"
              type={showPassword ? 'text' : 'password'}
              name="newPassword"
              placeholder="Yeni şifrenizi giriniz"
              icon={<Lock size={18} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <Input
              label="Yeni Şifre (Tekrar)"
              type={showPassword ? 'text' : 'password'}
              name="newPasswordConfirm"
              placeholder="Yeni şifrenizi tekrar giriniz"
              icon={<Lock size={18} />}
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />

            {error && (
              <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Şifremi Güncelle
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            ← Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
