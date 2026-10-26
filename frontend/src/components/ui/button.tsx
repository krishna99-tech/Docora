import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'brand';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)] focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variantStyles = {
      default: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:scale-[0.99] shadow-xs',
      gradient: 'bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white hover:opacity-95 shadow-sm hover:shadow-[var(--brand-glow)] active:scale-[0.99] border-0 font-semibold',
      brand: 'bg-[var(--brand-subtle)] text-[var(--brand-from)] border border-[var(--brand-border)] hover:bg-[var(--brand-from)] hover:text-white transition-all',
      secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)]',
      outline: 'bg-transparent text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)]',
      ghost: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.99]',
    };

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
      icon: 'p-2 w-9 h-9',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
