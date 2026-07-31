'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Bookmark,
  ClipboardList,
  FileText,
  Heart,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Landmark,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/lib/auth-context';
import { useNotificationCount } from '@/lib/notification-count-context';

const DONATION_URL = process.env.NEXT_PUBLIC_DONATION_URL;

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/uygun-ilanlar', label: 'Bana Uygun İlanlar', icon: ListChecks },
  { href: '/dashboard/ilanlar', label: 'Tüm İlanlar', icon: ClipboardList },
  { href: '/dashboard/favoriler', label: 'Favorilerim', icon: Bookmark },
  { href: '/dashboard/bildirimler', label: 'Bildirimlerim', icon: Bell },
  { href: '/dashboard/basvurularim', label: 'Başvurularım', icon: FileText },
  { href: '/dashboard/profil', label: 'Profilim', icon: User },
  { href: '/dashboard/kurumlar', label: 'Kurumlar', icon: Landmark },
  { href: '/dashboard/ayarlar', label: 'Ayarlar', icon: Settings },
  { href: '/dashboard/yardim', label: 'Yardım Merkezi', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, viewAsAdmin } = useAuth();
  const { unreadCount: unreadNotificationCount } = useNotificationCount();
  const [showDonationNotice, setShowDonationNotice] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleReturnToAdmin = () => {
    viewAsAdmin();
    router.push(user?.role === 'MODERATOR' ? '/admin/moderasyon' : '/admin');
  };

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-100 bg-white px-4 py-6">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const badge = item.href === '/dashboard/bildirimler' ? unreadNotificationCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              <span className="flex items-center gap-3">
                <Icon size={18} />
                {item.label}
              </span>
              {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
        <button
          onClick={handleReturnToAdmin}
          className="mb-1 flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          <ShieldCheck size={18} />
          {user?.role === 'MODERATOR' ? 'Moderatör Paneline Dön' : 'Yönetim Paneline Dön'}
        </button>
      )}

      {DONATION_URL ? (
        <a
          href={DONATION_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-3 rounded-xl border border-danger-100 bg-danger-50/60 px-3 py-2.5 text-sm font-medium text-danger-700 hover:bg-danger-50"
        >
          <Heart size={18} />
          Bizi Destekleyin
        </a>
      ) : (
        <div className="relative mt-4">
          <button
            type="button"
            onClick={() => setShowDonationNotice((prev) => !prev)}
            className="flex w-full items-center gap-3 rounded-xl border border-danger-100 bg-danger-50/60 px-3 py-2.5 text-sm font-medium text-danger-700 hover:bg-danger-50"
          >
            <Heart size={18} />
            Bizi Destekleyin
          </button>
          {showDonationNotice && (
            <div className="absolute bottom-12 left-0 w-56 rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-500 shadow-card">
              Bağış özelliği yakında açılacak.
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleLogout}
        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-danger-600"
      >
        <LogOut size={18} />
        Çıkış Yap
      </button>
    </aside>
  );
}
