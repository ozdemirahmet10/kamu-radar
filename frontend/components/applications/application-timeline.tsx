import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/lib/api-client';

const STEP_LABELS = ['Evrak Bekleniyor', 'İnceleniyor', 'Mülakat'];

function resultLabel(status: ApplicationStatus): string {
  if (status === 'ACCEPTED') return 'Olumlu Sonuç';
  if (status === 'REJECTED') return 'Olumsuz Sonuç';
  return 'Sonuç Bekleniyor';
}

function currentIndex(status: ApplicationStatus): number {
  switch (status) {
    case 'DOCUMENTS_PENDING':
      return 0;
    case 'UNDER_REVIEW':
      return 1;
    case 'INTERVIEW':
      return 2;
    case 'ACCEPTED':
    case 'REJECTED':
      return 3;
  }
}

export function ApplicationTimeline({ status }: { status: ApplicationStatus }) {
  const labels = [...STEP_LABELS, resultLabel(status)];
  const current = currentIndex(status);
  const isRejected = status === 'REJECTED';

  return (
    <div className="flex items-start">
      {labels.map((label, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;
        const isCurrentRejected = isCurrent && isRejected;
        const isLast = index === labels.length - 1;

        return (
          <div key={label} className={cn('flex items-start', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  isCompleted && 'bg-success-600 text-white',
                  isCurrent && !isCurrentRejected && 'bg-brand-600 text-white',
                  isCurrentRejected && 'bg-danger-600 text-white',
                  !isCompleted && !isCurrent && 'bg-slate-100 text-slate-400',
                )}
              >
                {isCompleted ? <Check size={13} /> : index + 1}
              </span>
              <span
                className={cn(
                  'mt-1.5 max-w-[80px] text-center text-[11px] leading-tight',
                  isCompleted && 'font-medium text-success-700',
                  isCurrent && !isCurrentRejected && 'font-semibold text-brand-700',
                  isCurrentRejected && 'font-semibold text-danger-700',
                  !isCompleted && !isCurrent && 'text-slate-400',
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'mt-3 h-0.5 flex-1',
                  index < current ? 'bg-success-600' : 'bg-slate-100',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
