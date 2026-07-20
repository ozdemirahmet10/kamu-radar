'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ExternalLink, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ApplicationTimeline } from './application-timeline';
import { APPLICATION_STATUS_BADGE, APPLICATION_STATUS_LABELS } from './application-status';
import type { ApplicationStatus, City, JobApplication, UpdateApplicationPayload } from '@/lib/api-client';

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

interface ApplicationCardProps {
  application: JobApplication;
  city: City | undefined;
  onUpdate: (jobPostingId: string, payload: UpdateApplicationPayload) => void;
  onRemove: (jobPostingId: string) => void;
}

export function ApplicationCard({ application, city, onUpdate, onRemove }: ApplicationCardProps) {
  const router = useRouter();
  const { jobPosting } = application;
  const [note, setNote] = useState(application.note ?? '');
  const [nextActionLabel, setNextActionLabel] = useState(application.nextActionLabel ?? '');
  const [nextActionDate, setNextActionDate] = useState(toDateInputValue(application.nextActionDate));

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Building2 size={22} />
          </span>
          <div>
            <Badge variant={APPLICATION_STATUS_BADGE[application.status]} className="mb-1.5">
              {APPLICATION_STATUS_LABELS[application.status]}
            </Badge>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/ilanlar/${jobPosting.id}`)}
              className="block text-left text-sm font-semibold text-slate-900 hover:text-brand-600"
            >
              {jobPosting.positionTitle}
            </button>
            <p className="text-xs text-slate-500">{jobPosting.institutionName}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {city && <Badge variant="neutral">{city.name}</Badge>}
              {jobPosting.kpssScoreType && <Badge variant="neutral">{jobPosting.kpssScoreType}</Badge>}
              {jobPosting.minKpssScore !== null && (
                <Badge variant="neutral">{jobPosting.minKpssScore} Puan</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {jobPosting.applicationUrl && (
            <a
              href={jobPosting.applicationUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-brand-600"
              aria-label="İlana git"
            >
              <ExternalLink size={16} />
            </a>
          )}
          <button
            type="button"
            onClick={() => onRemove(jobPosting.id)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-danger-100 hover:text-danger-600"
            aria-label="Takipten kaldır"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-3">
        <div>
          <p className="text-slate-400">Başvuru Tarihi</p>
          <p className="font-semibold text-slate-700">{formatDate(application.createdAt)}</p>
        </div>
        <div>
          <p className="text-slate-400">Son Güncelleme</p>
          <p className="font-semibold text-slate-700">{formatDate(application.updatedAt)}</p>
        </div>
        <div>
          <p className="text-slate-400">Son Başvuru Tarihi</p>
          <p className="font-semibold text-slate-700">{formatDate(jobPosting.applicationEndDate)}</p>
        </div>
      </div>

      <div className="mt-5">
        <ApplicationTimeline status={application.status} />
      </div>

      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Durumu Güncelle</label>
          <select
            className={selectClass}
            value={application.status}
            onChange={(e) =>
              onUpdate(jobPosting.id, { status: e.target.value as ApplicationStatus })
            }
          >
            {(Object.entries(APPLICATION_STATUS_LABELS) as [ApplicationStatus, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Sonraki Adım</label>
            <input
              type="text"
              placeholder="Örn. Mülakat"
              value={nextActionLabel}
              onChange={(e) => setNextActionLabel(e.target.value)}
              onBlur={() => onUpdate(jobPosting.id, { nextActionLabel })}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Tarih</label>
            <input
              type="date"
              value={nextActionDate}
              onChange={(e) => {
                setNextActionDate(e.target.value);
                onUpdate(jobPosting.id, { nextActionDate: e.target.value });
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-500">Notunuz</label>
        <textarea
          rows={2}
          placeholder="Bu başvuruyla ilgili kendinize not bırakın..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => onUpdate(jobPosting.id, { note })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
    </Card>
  );
}
