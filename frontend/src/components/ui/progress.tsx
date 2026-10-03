import React from 'react';
import { cn } from './button';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  label: string;
}

export function Progress({ value, label, className, ...props }: ProgressProps) {
  const boundedValue = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={boundedValue}
      className={cn('h-2 overflow-hidden rounded-full bg-white/[0.07]', className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-zinc-300 to-white transition-[width] duration-500"
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  );
}
