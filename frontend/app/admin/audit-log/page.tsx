'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/dashboard/pagination';
import { useAuth } from '@/lib/auth-context';
import { adminAuditLogApi, AuditLogEntry } from '@/lib/api-client';

const PAGE_SIZE = 30;

const ACTION_LABELS: Record<string, string> = {
  USER_ROLE_CHANGED: 'Rol Değiştirildi',
  USER_SUSPENDED: 'Hesap Askıya Alındı',
  USER_REACTIVATED: 'Hesap Yeniden Aktif Edildi',
  USER_DELETED: 'Hesap Silindi',
  USER_RESTORED: 'Hesap Geri Getirildi',
  JOB_POSTING_APPROVED: 'İlan Onaylandı',
  JOB_POSTING_ARCHIVED: 'İlan Arşivlendi',
};

const ACTION_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  USER_ROLE_CHANGED: 'neutral',
  USER_SUSPENDED: 'warning',
  USER_REACTIVATED: 'success',
  USER_DELETED: 'danger',
  USER_RESTORED: 'success',
  JOB_POSTING_APPROVED: 'success',
  JOB_POSTING_ARCHIVED: 'danger',
};

const ENTITY_TYPE_OPTIONS = ['User', 'JobPosting'];

function formatChanges(changes: unknown): string {
  if (!changes) return '-';
  try {
    return JSON.stringify(changes);
  } catch {
    return '-';
  }
}

function AuditLogContent() {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [entityType, setEntityType] = useState('');

  const fetchLogs = async (targetPage: number) => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await adminAuditLogApi.list(
        { entityType: entityType || undefined, page: targetPage, pageSize: PAGE_SIZE },
        accessToken,
      );
      setEntries(result.items);
      setPage(result.page);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Toplam <span className="font-semibold text-slate-900">{totalCount}</span> hassas işlem kaydı
        </p>
      </div>

      <div className="flex gap-2">
        <select
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          <option value="">Tüm varlık türleri</option>
          {ENTITY_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={() => fetchLogs(1)}>
          Filtrele
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-600" size={24} />
          </div>
        ) : entries.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">Kayıt bulunamadı.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Yapan</th>
                <th className="px-4 py-3">İşlem</th>
                <th className="px-4 py-3">Varlık</th>
                <th className="px-4 py-3">Detay</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(entry.createdAt).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {entry.actorFullName ?? entry.actorEmail ?? 'Sistem'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ACTION_BADGE_VARIANT[entry.action] ?? 'neutral'}>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {entry.entityType} · {entry.entityId.slice(0, 8)}...
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-xs text-slate-400">
                    {formatChanges(entry.changes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchLogs(p)} />
    </div>
  );
}

export default function AuditLogPage() {
  return (
    <AdminShell>
      <AuditLogContent />
    </AdminShell>
  );
}
