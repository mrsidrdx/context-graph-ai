'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-14 w-full rounded-full border-2 border-neutral-600 bg-neutral-800/30 px-5 py-2 text-base transition-all duration-200',
          'placeholder:text-neutral-500',
          'text-neutral-100',
          'focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
