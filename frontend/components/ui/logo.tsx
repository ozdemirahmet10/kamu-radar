import { Radar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { icon: 'h-8 w-8', text: 'text-lg', glyph: 16 },
  md: { icon: 'h-9 w-9', text: 'text-xl', glyph: 18 },
  lg: { icon: 'h-11 w-11', text: 'text-2xl', glyph: 22 },
};

export function Logo({ variant = 'dark', size = 'md' }: LogoProps) {
  const dims = sizeMap[size];

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-card',
          dims.icon,
        )}
      >
        <Radar size={dims.glyph} strokeWidth={2.25} />
      </span>
      <span className={cn('font-bold tracking-tight', dims.text, variant === 'dark' ? 'text-slate-900' : 'text-white')}>
        KAMU <span className="text-brand-500">RADAR</span>
      </span>
    </div>
  );
}
