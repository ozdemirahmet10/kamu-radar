import { CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { UpcomingApplicationEvent } from '@/lib/api-client';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

export function UpcomingEvents({ events }: { events: UpcomingApplicationEvent[] }) {
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <CalendarClock size={18} className="text-brand-600" />
        Yaklaşan İşlemler
      </h2>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          Henüz eklenmiş bir sonraki adım tarihiniz yok. Başvuru kartındaki "Sonraki Adım"
          alanından ekleyebilirsiniz.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-slate-100">
          {events.map((event) => (
            <div key={`${event.jobPostingId}-${event.label}`} className="py-3">
              <p className="text-xs font-semibold text-brand-600">{formatDate(event.date)}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-900">{event.label}</p>
              <p className="text-xs text-slate-500">{event.institutionName}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
