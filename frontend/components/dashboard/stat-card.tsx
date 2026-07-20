import { ReactNode } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { IconTile } from '@/components/ui/icon-tile';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: ReactNode;
  color: 'success' | 'warning' | 'danger' | 'info' | 'accent';
  value: string | number;
  label: string;
  href?: string;
}

export function StatCard({ icon, color, value, label, href }: StatCardProps) {
  const content = (
    <Card
      className={cn(
        'flex flex-col items-center gap-4 text-center',
        href && 'transition-shadow hover:shadow-md',
      )}
    >
      <IconTile icon={icon} color={color} />
      <div>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
