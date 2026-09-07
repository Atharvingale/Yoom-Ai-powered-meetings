'use client';

import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

const Progress = ({ value, className, indicatorClassName }: ProgressProps) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-dark-3',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full bg-blue-1 transition-all duration-300',
          indicatorClassName,
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};

export { Progress };
export type { ProgressProps };
