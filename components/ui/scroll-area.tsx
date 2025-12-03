'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        <div className="h-full w-full overflow-auto">
          {children}
        </div>
        <ScrollBar />
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';

const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  // Simple scrollbar implementation without Radix UI
  return (
    <div
      ref={ref}
      className={cn(
        'absolute right-0 top-0 bottom-0 w-2.5 opacity-0 hover:opacity-100 transition-opacity',
        className
      )}
      {...props}
    >
      <div className="h-full w-full bg-neutral-300 dark:bg-neutral-600 rounded-full" />
    </div>
  );
});
ScrollBar.displayName = 'ScrollBar';

export { ScrollArea, ScrollBar };
