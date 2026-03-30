import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200', className)}
      {...props}
    />
  );
}
