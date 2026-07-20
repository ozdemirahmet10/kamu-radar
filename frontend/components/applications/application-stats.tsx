import { CheckCircle2, ClipboardList, MessageSquareText, ThumbsDown, Timer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { IconTile } from '@/components/ui/icon-tile';
import { ProgressRing } from '@/components/ui/progress-ring';
import type { ApplicationStats as ApplicationStatsData } from '@/lib/api-client';

export function ApplicationStats({ stats }: { stats: ApplicationStatsData }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <Card className="flex flex-col items-start gap-4">
        <IconTile icon={<ClipboardList size={20} />} color="info" />
        <div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-sm text-slate-500">Toplam Başvuru</p>
        </div>
      </Card>

      <Card className="flex flex-col items-start gap-4">
        <IconTile icon={<Timer size={20} />} color="warning" />
        <div>
          <p className="text-2xl font-bold text-slate-900">{stats.underReview}</p>
          <p className="text-sm text-slate-500">İnceleniyor</p>
        </div>
      </Card>

      <Card className="flex flex-col items-start gap-4">
        <IconTile icon={<MessageSquareText size={20} />} color="accent" />
        <div>
          <p className="text-2xl font-bold text-slate-900">{stats.interview}</p>
          <p className="text-sm text-slate-500">Mülakat</p>
        </div>
      </Card>

      <Card className="flex flex-col items-start gap-4">
        <IconTile icon={<CheckCircle2 size={20} />} color="success" />
        <div>
          <p className="text-2xl font-bold text-slate-900">{stats.accepted}</p>
          <p className="text-sm text-slate-500">Sonuçlandı</p>
        </div>
      </Card>

      <Card className="flex flex-col items-start gap-4">
        <IconTile icon={<ThumbsDown size={20} />} color="danger" />
        <div>
          <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
          <p className="text-sm text-slate-500">Olumsuz</p>
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center gap-1">
        <ProgressRing value={stats.successRate} size={64} strokeWidth={6} />
        <p className="text-sm text-slate-500">Başarı Oranı</p>
      </Card>
    </div>
  );
}
