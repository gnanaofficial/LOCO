import React from 'react';
import { cn } from './button';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-2 block text-xs font-medium text-zinc-300', className)} {...props} />;
}
