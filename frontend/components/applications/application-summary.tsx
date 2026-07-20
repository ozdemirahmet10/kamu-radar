import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import type { ApplicationStats } from '@/lib/api-client';

export function ApplicationSummary({ stats }: { stats: ApplicationStats }) {
  const ongoing = stats.documentsPending + stats.underReview + stats.interview;

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900">Başvuru Özeti</h2>
      <div className="mt-4 flex justify-center">
        <ProgressRing value={stats.successRate} label="Başarı Oranı" />
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-slate-500">Toplam Başvuru</span>
          <span className="text-sm font-semibold text-slate-900">{stats.total}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-slate-500">Devam Eden</span>
          <span className="text-sm font-semibold text-slate-900">{ongoing}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-slate-500">Mülakat</span>
          <span className="text-sm font-semibold text-slate-900">{stats.interview}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-slate-500">Sonuçlanan</span>
          <span className="text-sm font-semibold text-slate-900">
            {stats.accepted + stats.rejected}
          </span>
        </div>
      </div>
    </Card>
  );
}
