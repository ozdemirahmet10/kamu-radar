'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { ApiError, authApi } from '@/lib/api-client';

type Status = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Geçersiz bağlantı.');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMessage(
          err instanceof ApiError ? err.message : 'E-posta doğrulanamadı, tekrar deneyin.',
        );
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-card">
        <div className="mx-auto w-fit">
          <Logo />
        </div>

        <div className="mt-8">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto animate-spin text-brand-600" size={40} />
              <p className="mt-4 text-sm text-slate-500">E-posta adresiniz doğrulanıyor...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="mx-auto text-success-600" size={40} />
              <h1 className="mt-4 text-lg font-bold text-slate-900">E-posta Doğrulandı</h1>
              <p className="mt-2 text-sm text-slate-500">
                E-posta adresiniz başarıyla doğrulandı.
              </p>
              <Link href="/dashboard" className="mt-6 block">
                <Button className="w-full">Dashboard&apos;a Git</Button>
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="mx-auto text-danger-600" size={40} />
              <h1 className="mt-4 text-lg font-bold text-slate-900">Doğrulanamadı</h1>
              <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>
              <Link href="/dashboard/ayarlar" className="mt-6 block">
                <Button variant="outline" className="w-full">
                  Ayarlar&apos;dan Tekrar Gönder
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
