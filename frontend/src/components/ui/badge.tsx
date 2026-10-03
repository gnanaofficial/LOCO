import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './button';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        default: 'border-white/10 bg-white/[0.06] text-zinc-200',
        success: 'border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-200',
        warning: 'border-amber-400/15 bg-amber-400/[0.07] text-amber-200',
        destructive: 'border-rose-400/15 bg-rose-400/[0.07] text-rose-200',
        outline: 'border-white/10 bg-transparent text-zinc-300',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
