import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'button-primary border border-white/70 bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-950 shadow-[0_6px_24px_rgba(255,255,255,0.09),inset_0_1px_0_rgba(255,255,255,0.75)] hover:from-white hover:to-zinc-200 active:translate-y-px',
        glass: 'border border-white/10 bg-white/[0.055] text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl hover:border-white/15 hover:bg-white/[0.09] hover:text-white',
        ghost: 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100',
        subtle: 'border border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/[0.075] hover:text-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-5',
        icon: 'size-10 rounded-xl',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> & VariantProps<typeof buttonVariants>;
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});

type ButtonLinkProps = Omit<LinkProps, 'className'> & VariantProps<typeof buttonVariants> & { className?: string; children: React.ReactNode };
export function ButtonLink({ className, variant, size, children, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props}>{children}</Link>;
}
