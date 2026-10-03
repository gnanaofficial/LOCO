import React from 'react';
import { cn } from './button';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn('control-input h-11 rounded-xl px-3.5 text-sm', className)}
        {...props}
      />
    );
  },
);
