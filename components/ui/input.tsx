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
          'flex h-14 w-full rounded-full border-2 border-neutral-300 bg-transparent px-5 py-2 text-base transition-all duration-200',
          'placeholder:text-neutral-400',
          'focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-neutral-600 dark:focus:border-primary-400 dark:focus:ring-primary-400/10',
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
