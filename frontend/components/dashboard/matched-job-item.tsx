'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Heart, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { favoritesApi, matchFeedbackApi } from '@/lib/api-client';
import type { City, MatchedJobPosting } from '@/lib/api-client';

const STATUS_BADGE: Record<MatchedJobPosting['status'], { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  ELIGIBLE: { label: 'Başvurulabilir', variant: 'success' },
  PARTIALLY_ELIGIBLE: { label: 'Bazı Şartlar Eksik', variant: 'warning' },
  NOT_ELIGIBLE: { label: 'Başvuramazsınız', variant: 'danger' },
};

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function MatchedJobItem({
  match,
  city,
  isFavorite: isFavoriteProp = false,
  onFavoriteChange,
  feedbackGiven: feedbackGivenProp = null,
}: {
  match: MatchedJobPosting;
  city: City | undefined;
  isFavorite?: boolean;
  onFavoriteChange?: (jobPostingId: string, isFavorite: boolean) => void;
  feedbackGiven?: boolean | null;
}) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { jobPosting } = match;
  const statusBadge = STATUS_BADGE[match.status];
  const [isFavorite, setIsFavorite] = useState(isFavoriteProp);
  const [isToggling, setIsToggling] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(feedbackGivenProp);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => setIsFavorite(isFavoriteProp), [isFavoriteProp]);
  useEffect(() => setFeedbackGiven(feedbackGivenProp), [feedbackGivenProp]);

  const handleSubmitFeedback = async (e: React.MouseEvent, isAccurate: boolean) => {
    e.stopPropagation();
    if (!accessToken || isSubmittingFeedback || feedbackGiven !== null) return;
    setIsSubmittingFeedback(true);
    try {
      await matchFeedbackApi.submit(jobPosting.id, isAccurate, undefined, accessToken);
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
        await favoritesApi.add(jobPosting.id, accessToken);
      } else {
        await favoritesApi.remove(jobPosting.id, accessToken);
      }
      onFavoriteChange?.(jobPosting.id, next);
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
      onClick={() => router.push(`/dashboard/ilanlar/${jobPosting.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/dashboard/ilanlar/${jobPosting.id}`)}
      className="flex cursor-pointer items-start justify-between gap-3 border-b border-slate-100 py-4 last:border-0 last:pb-0"
    >
      <div>
        <Badge variant={statusBadge.variant} className="mb-1.5">
          {statusBadge.label}
        </Badge>
        <p className="text-sm font-semibold text-slate-900 hover:text-brand-600">
          {jobPosting.positionTitle}
        </p>
        <p className="text-xs text-slate-500">{jobPosting.institutionName}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {city && <Badge variant="neutral">{city.name}</Badge>}
          {jobPosting.kpssScoreType && <Badge variant="neutral">{jobPosting.kpssScoreType}</Badge>}
          {jobPosting.minKpssScore !== null && (
            <Badge variant="neutral">{jobPosting.minKpssScore} Puan</Badge>
          )}
        </div>
        {match.missingCriteria.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">{match.missingCriteria.join(' · ')}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <Badge variant="success" className="mb-1.5">
            %{match.matchPercentage} Uygunluk
          </Badge>
          <p className="text-xs text-slate-400">Son Başvuru</p>
          <p className="text-xs font-semibold text-slate-700">
            {formatDate(jobPosting.applicationEndDate)}
          </p>
        </div>
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
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={isFavorite ? 'text-danger-600' : 'text-slate-300 hover:text-danger-600'}
          aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <ChevronRight size={18} className="text-slate-300" />
      </div>
    </div>
  );
}
