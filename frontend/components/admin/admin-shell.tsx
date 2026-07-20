'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  ClipboardList,
  Eye,
  Hash,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Radar,
  ShieldCheck,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

type AdminRole = 'ADMIN' | 'MODERATOR';

const NAV_ITEMS: { href: string; label: string; icon: typeof LayoutDashboard; roles: AdminRole[] }[] = [
  { href: '/admin', label: 'Genel Bakış', icon: LayoutDashboard, roles: ['ADMIN'] },
  { href: '/admin/ilanlar', label: 'İlan Yönetimi', icon: ClipboardList, roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/moderasyon', label: 'Moderasyon Kuyruğu', icon: ShieldAlert, roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: Users, roles: ['ADMIN'] },
  { href: '/admin/crawler', label: 'Crawler İzleme', icon: Radar, roles: ['ADMIN'] },
  { href: '/admin/audit-log', label: 'Audit Log', icon: History, roles: ['ADMIN'] },
  { href: '/admin/nitelik-kodlari', label: 'Nitelik Kodları', icon: Hash, roles: ['ADMIN'] },
  { href: '/admin/sistem-durumu', label: 'Sistem Sağlığı', icon: Activity, roles: ['ADMIN'] },
];

function AdminSidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, viewAsUser } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleViewAsUser = () => {
    viewAsUser();
    router.push('/dashboard');
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-100 bg-white px-4 py-6">
      <div className="px-2">
        <Logo />
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-600">
          <ShieldCheck size={14} />
          {role === 'ADMIN' ? 'Yönetim Paneli' : 'Moderatör Paneli'}
        </div>
      </div>

      <nav className="mt-8 flex-1 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleViewAsUser}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
      >
        <Eye size={18} />
        Kullanıcı Gözünden Gör
      </button>
      <button
        onClick={handleLogout}
        className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-danger-600"
      >
        <LogOut size={18} />
        Çıkış Yap
      </button>
    </aside>
  );
}

interface AdminShellProps {
  children: ReactNode;
  /** Bu sayfayı hangi roller görebilir. Varsayılan: sadece ADMIN. */
  allowedRoles?: AdminRole[];
}

export function AdminShell({ children, allowedRoles = ['ADMIN'] }: AdminShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const role = user?.role as AdminRole | undefined;
  const isAdminOrModerator = role === 'ADMIN' || role === 'MODERATOR';
  const isAllowedHere = isAdminOrModerator && allowedRoles.includes(role!);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isAdminOrModerator) {
      router.replace('/dashboard');
      return;
    }
    if (!isAllowedHere) {
      router.replace('/admin/moderasyon');
    }
  }, [isLoading, user, isAdminOrModerator, isAllowedHere, router]);

  if (isLoading || !user || !isAdminOrModerator || !isAllowedHere) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar role={role!} />
      <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
    </div>
  );
}
