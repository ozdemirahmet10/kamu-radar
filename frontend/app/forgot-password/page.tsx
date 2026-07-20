'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, BarChart3, Mail, ShieldCheck, Target } from 'lucide-react';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api-client';

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email);
    } catch {
      // Kullanıcı numaralandırmasını (enumeration) önlemek için hata durumunda da
      // aynı başarı mesajı gösterilir — backend zaten hesap var/yok ayrımı yapmıyor.
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <AuthSplitLayout
      headline={
        <>
          Şifrenizi
          <br />
          birlikte sıfırlayalım.
        </>
      }
      description="E-posta adresinizi girin, size bir şifre sıfırlama bağlantısı gönderelim."
      features={FEATURES}
    >
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-3xl font-bold text-slate-900">Şifremi Unuttum</h1>
        <p className="mt-2 text-sm text-slate-500">
          Hesabınıza kayıtlı e-posta adresinizi girin, sıfırlama bağlantısını gönderelim.
        </p>

        {isSubmitted ? (
          <p className="mt-8 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-700">
            Eğer bu e-posta adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
            Gelen kutunuzu (ve spam klasörünü) kontrol edin.
          </p>
        ) : (
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

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Sıfırlama Bağlantısı Gönder
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
