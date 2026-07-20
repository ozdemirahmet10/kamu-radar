'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Database, HardDrive, Loader2, RefreshCw, XCircle, Zap } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { adminSystemHealthApi, ComponentHealth, SystemHealth } from '@/lib/api-client';

function ComponentCard({
  icon,
  label,
  health,
}: {
  icon: React.ReactNode;
  label: string;
  health: ComponentHealth;
}) {
  const isOk = health.status === 'ok';
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isOk ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'
            }`}
          >
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">
              {isOk ? `${health.latencyMs} ms` : health.error ?? 'Bağlantı hatası'}
            </p>
          </div>
        </div>
        {isOk ? (
          <CheckCircle2 size={20} className="text-success-600" />
        ) : (
          <XCircle size={20} className="text-danger-600" />
        )}
      </div>
    </Card>
  );
}

function SystemHealthContent() {
  const { accessToken } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await adminSystemHealthApi.check(accessToken);
      setHealth(result);
    } catch {
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const allOk =
    health && health.database.status === 'ok' && health.redis.status === 'ok' && health.minio.status === 'ok';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sistem Sağlığı</h1>
          <p className="mt-1 text-sm text-slate-500">
            Veritabanı, önbellek/kuyruk ve dosya deposu bağlantı durumu.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchHealth} isLoading={isLoading}>
          <RefreshCw size={16} />
          Yenile
        </Button>
      </div>

      {isLoading && !health ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-600" size={24} />
        </div>
      ) : !health ? (
        <Card>
          <p className="py-6 text-center text-sm text-danger-600">
            Sistem sağlığı bilgisi alınamadı. Backend'e ulaşılamıyor olabilir.
          </p>
        </Card>
      ) : (
        <>
          <div
            className={`rounded-2xl px-5 py-4 text-sm font-medium ${
              allOk ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
            }`}
          >
            {allOk
              ? 'Tüm sistemler normal çalışıyor.'
              : 'Bir veya daha fazla bileşende sorun tespit edildi.'}
            <span className="ml-2 text-xs opacity-70">
              Son kontrol: {new Date(health.checkedAt).toLocaleTimeString('tr-TR')}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <ComponentCard icon={<Database size={18} />} label="Veritabanı (Postgres)" health={health.database} />
            <ComponentCard icon={<Zap size={18} />} label="Redis / Kuyruk" health={health.redis} />
            <ComponentCard icon={<HardDrive size={18} />} label="Dosya Deposu (MinIO)" health={health.minio} />
          </div>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">Crawler Kuyruğu (BullMQ)</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {(
                [
                  ['Bekleyen', health.queue.waiting, 'neutral'],
                  ['İşleniyor', health.queue.active, 'info'],
                  ['Tamamlanan', health.queue.completed, 'success'],
                  ['Başarısız', health.queue.failed, 'danger'],
                  ['Ertelenen', health.queue.delayed, 'warning'],
                ] as const
              ).map(([label, count, variant]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-lg font-bold text-slate-900">{count}</p>
                  <Badge variant={variant} className="mt-1">
                    {label}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default function SystemHealthPage() {
  return (
    <AdminShell>
      <SystemHealthContent />
    </AdminShell>
  );
}
