'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, BarChart3, Eye, EyeOff, Lock, Mail, ShieldCheck, Target } from 'lucide-react';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';

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

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    setJustRegistered(new URLSearchParams(window.location.search).get('registered') === '1');
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const loggedInUser = await login({ email, password });
      if (loggedInUser.role === 'ADMIN') {
        router.push('/admin');
      } else if (loggedInUser.role === 'MODERATOR') {
        router.push('/admin/moderasyon');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Giriş yapılamadı, lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      headline={
        <>
          Doğru ilan,
          <br />
          doğru zamanda,
          <br />
          sizinle buluşur.
        </>
      }
      description="KAMU RADAR, KPSS puanınıza ve profilinize uygun kamu ilanlarını sizin için takip eder, size en uygun fırsatları sunar."
      features={FEATURES}
    >
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-3xl font-bold text-slate-900">Giriş Yap</h1>
        <p className="mt-2 text-sm text-slate-500">
          Hesabınıza giriş yaparak ilanları takip etmeye devam edin.
        </p>

        {justRegistered && (
          <p className="mt-4 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-700">
            Kaydınız başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            label="E-posta"
            type="email"
            name="email"
            placeholder="E-posta adresinizi giriniz"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <Input
            label="Şifre"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Şifrenizi giriniz"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-between">
            <Checkbox
              name="rememberMe"
              label="Beni hatırla"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Şifremi unuttum?
            </Link>
          </div>

          {error && (
            <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Giriş Yap
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">veya</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <SocialLoginButtons />

        <p className="mt-8 text-center text-sm text-slate-500">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Kayıt olun
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
