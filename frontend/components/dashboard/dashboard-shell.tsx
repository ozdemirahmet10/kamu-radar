'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

function adminLandingPath(role: string | undefined): string {
  return role === 'MODERATOR' ? '/admin/moderasyon' : '/admin';
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, isLoading, viewMode } = useAuth();
  const router = useRouter();
  const isStaffBlocked =
    (user?.role === 'ADMIN' || user?.role === 'MODERATOR') && viewMode !== 'user';

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (isStaffBlocked) {
      router.replace(adminLandingPath(user.role));
    }
  }, [isLoading, user, isStaffBlocked, router]);

  if (isLoading || !user || isStaffBlocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {ADSENSE_CLIENT_ID && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
