'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Bell, Eye, EyeOff, Folder, Lock, Mail, Phone, Target, User } from 'lucide-react';
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
    title: 'Size Uygun İlanlar',
    description: 'KPSS puanınıza ve tercihlerinize uygun ilanları anında görün.',
  },
  {
    icon: <Bell size={18} />,
    title: 'Anında Bildirim',
    description: 'Yeni ilanlar ve son başvuru tarihleri hakkında anında haberdar olun.',
  },
  {
    icon: <Folder size={18} />,
    title: 'Kolay Başvuru Takibi',
    description: 'Tüm başvurularınızı tek yerden takip edin, hiçbirini kaçırmayın.',
  },
  {
    icon: <BarChart3 size={18} />,
    title: 'Kariyer Analizi',
    description: 'Radar skorunuz ve istatistiklerle kariyer yolculuğunuzu planlayın.',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }
    if (!acceptedTerms) {
      setError('Devam etmek için kullanım şartlarını kabul etmelisiniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName,
        email,
        password,
        phone: phone ? `+90${phone.replace(/\D/g, '')}` : undefined,
      });
      router.push('/login?registered=1');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kayıt oluşturulamadı, lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      headline={
        <>
          Kariyer hedeflerinize
          <br />
          bir adım daha yaklaşın.
          <br />
          <span className="text-brand-300">KAMU RADAR</span> ile
          <br />
          doğru ilanlara ulaşın.
        </>
      }
      description="Profilinizi oluşturun, size uygun kamu ilanlarını kaçırmayın, başvuru süreçlerinizi kolay yönetin."
      features={FEATURES}
      trustBadges={['256-bit ile Güvenli', 'KVKK Uyumlu', '50.000+ Mutlu Kullanıcı']}
    >
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-900">Kayıt Ol</h1>
        <p className="mt-2 text-sm text-slate-500">
          Ücretsiz hesabınızı oluşturun ve hemen başlayın.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            label="Ad Soyad"
            name="fullName"
            placeholder="Adınızı ve soyadınızı giriniz"
            icon={<User size={18} />}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              label="Telefon"
              type="tel"
              name="phone"
              placeholder="5XX XXX XX XX"
              icon={<Phone size={18} />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel-national"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Input
              label="Şifre Tekrar"
              type={showPasswordConfirm ? 'text' : 'password'}
              name="passwordConfirm"
              placeholder="Şifrenizi tekrar giriniz"
              icon={<Lock size={18} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label={showPasswordConfirm ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <Checkbox
              name="acceptedTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              label={
                <span>
                  <Link href="/terms" className="font-medium text-brand-600 hover:text-brand-700">
                    Kullanım şartları
                  </Link>{' '}
                  ve{' '}
                  <Link href="/privacy" className="font-medium text-brand-600 hover:text-brand-700">
                    gizlilik politikasını
                  </Link>{' '}
                  okudum, kabul ediyorum.
                </span>
              }
            />
          </div>

          {error && (
            <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Kayıt Ol
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">veya</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <SocialLoginButtons />

        <p className="mt-8 text-center text-sm text-slate-500">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Giriş yapın
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
