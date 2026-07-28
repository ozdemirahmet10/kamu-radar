'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ExternalLink, Heart, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { favoritesApi, matchFeedbackApi } from '@/lib/api-client';
import type { City, EligibilityStatus, JobPosting } from '@/lib/api-client';

const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_THRESHOLD_DAYS = 3;
const NEW_THRESHOLD_DAYS = 3;

const ELIGIBILITY_BADGE: Record<
  EligibilityStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  ELIGIBLE: { label: 'Başvurulabilir', variant: 'success' },
  PARTIALLY_ELIGIBLE: { label: 'Bazı Şartlar Eksik', variant: 'warning' },
  NOT_ELIGIBLE: { label: 'Başvurulamaz', variant: 'danger' },
};

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getStatusBadge(
  job: JobPosting,
): { label: string; variant: 'warning' | 'success' } | null {
  const isNew = Date.now() - new Date(job.createdAt).getTime() < NEW_THRESHOLD_DAYS * DAY_MS;
  if (job.applicationEndDate) {
    const daysLeft = (new Date(job.applicationEndDate).getTime() - Date.now()) / DAY_MS;
    if (daysLeft >= 0 && daysLeft <= SOON_THRESHOLD_DAYS) {
      return { label: 'Son Başvuru Yaklaşıyor', variant: 'warning' };
    }
  }
  if (isNew) {
    return { label: 'Yeni', variant: 'success' };
  }
  return null;
}

export function JobPostingCard({
  job,
  city,
  eligibilityStatus,
  matchPercentage,
  isFavorite: isFavoriteProp = false,
  onFavoriteChange,
}: {
  job: JobPosting;
  city: City | undefined;
  eligibilityStatus?: EligibilityStatus;
  matchPercentage?: number;
  isFavorite?: boolean;
  onFavoriteChange?: (jobPostingId: string, isFavorite: boolean) => void;
}) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [isFavorite, setIsFavorite] = useState(isFavoriteProp);
  const [isToggling, setIsToggling] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const statusBadge = getStatusBadge(job);
  const eligibilityBadge = eligibilityStatus ? ELIGIBILITY_BADGE[eligibilityStatus] : null;

  useEffect(() => setIsFavorite(isFavoriteProp), [isFavoriteProp]);

  const handleSubmitFeedback = async (e: React.MouseEvent, isAccurate: boolean) => {
    e.stopPropagation();
    if (!accessToken || isSubmittingFeedback || feedbackGiven !== null) return;
    setIsSubmittingFeedback(true);
    try {
      await matchFeedbackApi.submit(job.id, isAccurate, undefined, accessToken);
      setFeedbackGiven(isAccurate);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!accessToken || isToggling) return;
    const next = !isFavorite;
    setIsFavorite(next);
    setIsToggling(true);
    try {
      if (next) {
        await favoritesApi.add(job.id, accessToken);
      } else {
        await favoritesApi.remove(job.id, accessToken);
      }
      onFavoriteChange?.(job.id, next);
    } catch {
      setIsFavorite(!next);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/dashboard/ilanlar/${job.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/dashboard/ilanlar/${job.id}`)}
      className="flex cursor-pointer flex-col gap-3 border-b border-slate-100 py-4 last:border-0 last:pb-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Building2 size={20} />
          </span>
          <div>
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              {matchPercentage !== undefined && (
                <Badge variant="success">%{matchPercentage} Uygunluk</Badge>
              )}
              {eligibilityBadge && (
                <Badge variant={eligibilityBadge.variant}>{eligibilityBadge.label}</Badge>
              )}
              {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
            </div>
            <p className="text-sm font-semibold text-slate-900 hover:text-brand-600">
              {job.positionTitle}
            </p>
            <p className="text-xs text-slate-500">{job.institutionName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-400">Son Başvuru</p>
            <p className="text-xs font-semibold text-slate-700">
              {formatDate(job.applicationEndDate)}
            </p>
          </div>
          {job.applicationUrl && (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-300 hover:text-brand-600"
              aria-label="Başvuru sayfasına git"
            >
              <ExternalLink size={18} />
            </a>
          )}
          {eligibilityStatus && (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {feedbackGiven === null ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleSubmitFeedback(e, true)}
                    className="text-slate-300 hover:text-success-600"
                    aria-label="Bu eşleştirme doğruydu"
                    title="Bu eşleştirme doğruydu"
                  >
                    <ThumbsUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmitFeedback(e, false)}
                    className="text-slate-300 hover:text-danger-600"
                    aria-label="Bu eşleştirme doğru değildi"
                    title="Bu eşleştirme doğru değildi"
                  >
                    <ThumbsDown size={16} />
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-400">Teşekkürler!</span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={isFavorite ? 'text-danger-600' : 'text-slate-300 hover:text-danger-600'}
            aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      <div className="ml-14 flex flex-wrap items-center gap-2">
        {city && <Badge variant="neutral">{city.name}</Badge>}
        {job.kpssScoreType && <Badge variant="neutral">{job.kpssScoreType}</Badge>}
        {job.minKpssScore !== null && (
          <Badge variant="neutral">En az {job.minKpssScore} Puan</Badge>
        )}
        {job.quotaCount !== null && <Badge variant="neutral">{job.quotaCount} Kontenjan</Badge>}
      </div>
    </div>
  );
}
