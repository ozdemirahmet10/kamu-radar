'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/dashboard/pagination';
import { useAuth } from '@/lib/auth-context';
import { adminUsersApi, AdminUser } from '@/lib/api-client';

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<string, string> = {
  USER: 'Kullanıcı',
  MODERATOR: 'Moderatör',
  ADMIN: 'Yönetici',
};

const ROLE_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'neutral'> = {
  USER: 'neutral',
  MODERATOR: 'warning',
  ADMIN: 'success',
};

function StatusBadge({ user }: { user: AdminUser }) {
  if (user.isDeleted) return <Badge variant="danger">Silindi</Badge>;
  if (user.isSuspended) return <Badge variant="warning">Askıya Alındı</Badge>;
  return <Badge variant="success">Aktif</Badge>;
}

function AdminUsersContent() {
  const { user: currentUser, accessToken } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async (targetPage: number) => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await adminUsersApi.list(
        { keyword: keyword || undefined, page: targetPage, pageSize: PAGE_SIZE },
        accessToken,
      );
      setUsers(result.items);
      setPage(result.page);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleRoleChange = async (userId: string, role: string) => {
    if (!accessToken) return;
    if (!window.confirm('Bu kullanıcının rolünü değiştirmek istediğinize emin misiniz?')) return;
    setUpdatingId(userId);
    try {
      const updated = await adminUsersApi.updateRole(userId, role, accessToken);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch {
      window.alert('Rol güncellenemedi.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleSuspend = async (targetUser: AdminUser) => {
    if (!accessToken) return;
    const confirmMessage = targetUser.isSuspended
      ? 'Bu kullanıcının hesabını yeniden aktif etmek istediğinize emin misiniz?'
      : 'Bu kullanıcının hesabını askıya almak istediğinize emin misiniz? Kullanıcı giriş yapamayacaktır.';
    if (!window.confirm(confirmMessage)) return;
    setUpdatingId(targetUser.id);
    try {
      const updated = targetUser.isSuspended
        ? await adminUsersApi.reactivate(targetUser.id, accessToken)
        : await adminUsersApi.suspend(targetUser.id, accessToken);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
    } catch {
      window.alert('İşlem gerçekleştirilemedi.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleDelete = async (targetUser: AdminUser) => {
    if (!accessToken) return;
    const confirmMessage = targetUser.isDeleted
      ? 'Bu kullanıcının hesabını geri getirmek istediğinize emin misiniz?'
      : 'Bu kullanıcının hesabını silmek istediğinize emin misiniz? Kullanıcı giriş yapamayacaktır.';
    if (!window.confirm(confirmMessage)) return;
    setUpdatingId(targetUser.id);
    try {
      const updated = targetUser.isDeleted
        ? await adminUsersApi.restore(targetUser.id, accessToken)
        : await adminUsersApi.remove(targetUser.id, accessToken);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
    } catch {
      window.alert('İşlem gerçekleştirilemedi.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kullanıcılar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Toplam <span className="font-semibold text-slate-900">{totalCount}</span> kayıtlı kullanıcı
        </p>
      </div>

      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchUsers(1);
          }}
          placeholder="E-posta veya ad soyad ara..."
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <Button variant="outline" onClick={() => fetchUsers(1)}>
          Ara
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-600" size={24} />
          </div>
        ) : users.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">Kayıtlı kullanıcı bulunamadı.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Ad Soyad</th>
                <th className="px-4 py-3">E-posta</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Kayıt Tarihi</th>
                <th className="px-4 py-3">Rol Değiştir</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link href={`/admin/kullanicilar/${u.id}`} className="hover:text-brand-600 hover:underline">
                        {u.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_BADGE_VARIANT[u.role] ?? 'neutral'}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge user={u} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                        value={u.role}
                        disabled={updatingId === u.id || isSelf}
                        title={isSelf ? 'Kendi rolünüzü buradan değiştiremezsiniz' : undefined}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="px-3 py-1.5 text-xs text-warning-700 hover:bg-warning-50"
                          disabled={isSelf || u.isDeleted}
                          title={isSelf ? 'Kendi hesabınızı askıya alamazsınız' : undefined}
                          onClick={() => handleToggleSuspend(u)}
                          isLoading={updatingId === u.id}
                        >
                          {u.isSuspended ? 'Aktif Et' : 'Askıya Al'}
                        </Button>
                        <Button
                          variant="outline"
                          className="px-3 py-1.5 text-xs text-danger-600 hover:bg-danger-50"
                          disabled={isSelf}
                          title={isSelf ? 'Kendi hesabınızı silemezsiniz' : undefined}
                          onClick={() => handleToggleDelete(u)}
                          isLoading={updatingId === u.id}
                        >
                          {u.isDeleted ? 'Geri Getir' : 'Sil'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchUsers(p)} />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <AdminUsersContent />
    </AdminShell>
  );
}
