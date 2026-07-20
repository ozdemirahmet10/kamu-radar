import type { ApplicationStatus } from '@/lib/api-client';

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  DOCUMENTS_PENDING: 'Evrak Bekleniyor',
  UNDER_REVIEW: 'İnceleniyor',
  INTERVIEW: 'Mülakat',
  ACCEPTED: 'Sonuçlandı (Olumlu)',
  REJECTED: 'Olumsuz',
};

export const APPLICATION_STATUS_BADGE: Record<
  ApplicationStatus,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  DOCUMENTS_PENDING: 'neutral',
  UNDER_REVIEW: 'warning',
  INTERVIEW: 'info',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  'DOCUMENTS_PENDING',
  'UNDER_REVIEW',
  'INTERVIEW',
  'ACCEPTED',
];
