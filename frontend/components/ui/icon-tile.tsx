import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type IconTileColor = 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface IconTileProps {
  icon: ReactNode;
  color?: IconTileColor;
  size?: 'sm' | 'md';
  className?: string;
}

const colorClasses: Record<IconTileColor, string> = {
  success: 'bg-success-100 text-success-600',
  warning: 'bg-warning-100 text-warning-600',
  danger: 'bg-danger-100 text-danger-600',
  info: 'bg-brand-100 text-brand-600',
  accent: 'bg-accent-100 text-accent-600',
};

const sizeClasses = {
  sm: 'h-9 w-9 rounded-lg',
  md: 'h-11 w-11 rounded-xl',
};

export function IconTile({ icon, color = 'info', size = 'md', className }: IconTileProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center',
        colorClasses[color],
        sizeClasses[size],
        className,
      )}
    >
      {icon}
    </div>
  );
}
