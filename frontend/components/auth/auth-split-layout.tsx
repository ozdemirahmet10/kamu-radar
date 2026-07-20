import { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { DashboardPreviewMockup } from '@/components/auth/dashboard-preview-mockup';

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

interface AuthSplitLayoutProps {
  headline: ReactNode;
  description: string;
  features: Feature[];
  trustBadges?: string[];
  children: ReactNode;
}

export function AuthSplitLayout({
  headline,
  description,
  features,
  trustBadges,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-card lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-900 to-brand-800 p-10 text-white lg:flex">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full border border-white/10" />

          <div className="relative z-10">
            <Link href="/">
              <Logo variant="light" />
            </Link>
            <h1 className="mt-10 text-3xl font-bold leading-tight">{headline}</h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-200">{description}</p>

            <ul className="mt-8 space-y-4">
              {features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    {feature.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="text-xs text-slate-300">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mt-10">
            <DashboardPreviewMockup />
            {trustBadges && (
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
                {trustBadges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12">{children}</div>
      </div>
    </div>
  );
}
