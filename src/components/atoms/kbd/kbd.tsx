import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

export interface KbdProps {
  className?: string;
  children: ReactNode;
}

/**
 * A keyboard shortcut hint — ⌘K on the search field, Esc on the drawer.
 *
 * Uses the real `<kbd>` element rather than a styled span, so assistive tech
 * announces it as keyboard input instead of reading "⌘K" as text.
 */
export default function Kbd({ className = '', children }: KbdProps) {
  return (
    <kbd
      data-testid="sn-kbd"
      className={cn(
        'border-line text-caption text-muted inline-flex items-center rounded-sm border px-1.5 py-0.5 font-sans',
        className
      )}
    >
      {children}
    </kbd>
  );
}
