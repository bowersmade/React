import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

export type SortDirection = 'asc' | 'desc';

export interface SortHeaderProps {
  label: string;
  /** This column's key, handed back to `onSort`. */
  columnKey: string;
  /** Which column the table is currently sorted by. */
  activeKey?: string | null;
  direction?: SortDirection;
  onSort?: (key: string) => void;
  /** Right-align for numbers — CVSS, counts. */
  align?: 'left' | 'right';
  className?: string;
}

/**
 * One sortable column header.
 *
 * A real `<th>` with `scope="col"` and `aria-sort` — Virtuoso's TableVirtuoso
 * renders genuine table markup, so the semantics come from the elements rather
 * than from ARIA roles bolted onto divs.
 *
 * The control inside is a real `<button>`, so the header is tabbable and works
 * from the keyboard without any key handling of our own.
 *
 * Inactive columns show a faint two-way chevron rather than nothing: an
 * affordance that only appears on hover is invisible to anyone who never hovers.
 */
export default function SortHeader({
  label,
  columnKey,
  activeKey = null,
  direction = 'desc',
  onSort,
  align = 'left',
  className = '',
}: SortHeaderProps) {
  const isActive = activeKey === columnKey;
  const Icon = !isActive ? ChevronsUpDown : direction === 'asc' ? ArrowUp : ArrowDown;

  if (!onSort) {
    return (
      <th
        scope="col"
        className={cn(
          'text-caption text-muted px-6 py-2.5 font-sans font-semibold uppercase',
          align === 'right' ? 'text-right' : 'text-left',
          className
        )}
      >
        {label}
      </th>
    );
  }

  return (
    <th
      scope="col"
      aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-6 py-2.5', align === 'right' ? 'text-right' : 'text-left', className)}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={cn(
          'text-caption focus-visible:ring-accent focus-visible:ring-offset-page inline-flex items-center gap-1.5 rounded-xs font-sans font-semibold uppercase transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          isActive ? 'text-primary' : 'text-muted hover:text-secondary',
          align === 'right' && 'flex-row-reverse'
        )}
      >
        {label}
        <Icon
          size={13}
          aria-hidden="true"
          className={cn('shrink-0', isActive ? 'text-accent' : 'opacity-50')}
        />
      </button>
    </th>
  );
}
