import { SlidersHorizontal } from 'lucide-react';
import Chip from '../../atoms/chip/chip';
import Button from '../../atoms/button/button';
import { Typography } from '../../foundations/typography/typography';
import { cn } from '../../../utils/cn';

export interface AppliedFilter {
  /** Identifies which filter to drop when the chip is removed. */
  id: string;
  /** Category shown before the value: "Severity". */
  label: string;
  value: string;
  mono?: boolean;
}

export interface FilterBarProps {
  filters: AppliedFilter[];
  onRemove: (id: string) => void;
  onClear: () => void;
  /** Opens the filter modal. Omit to hide the button. */
  onAddFilter?: () => void;
  /** Findings matching the current filters, shown on the right. */
  resultCount?: number;
  /** Total before filtering, for the "of N" half. */
  totalCount?: number;
  className?: string;
}

/**
 * Horizontal strip of applied filters above the table.
 *
 * Its job is answering "why am I seeing these rows" at a glance, so it always
 * occupies its slot — an empty bar with the Add filter button is more useful
 * than a control that appears and disappears, which would shift the table.
 *
 * Clear all only renders when there is something to clear.
 */
export default function FilterBar({
  filters,
  onRemove,
  onClear,
  onAddFilter,
  resultCount,
  totalCount,
  className = '',
}: FilterBarProps) {
  const hasFilters = filters.length > 0;

  return (
    <div
      data-testid="sn-filter-bar"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {onAddFilter ? (
        <Button size="sm" icon={SlidersHorizontal} onClick={onAddFilter}>
          {hasFilters ? 'Edit filters' : 'Add filters'}
        </Button>
      ) : null}

      {hasFilters ? (
        filters.map((filter) => (
          <Chip
            key={filter.id}
            label={filter.label}
            value={filter.value}
            mono={filter.mono}
            onRemove={() => onRemove(filter.id)}
          />
        ))
      ) : (
        <Typography size="body-sm" color="muted">
          No filters applied — showing everything.
        </Typography>
      )}

      {hasFilters ? (
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear all
        </Button>
      ) : null}

      {resultCount !== undefined ? (
        <Typography size="body-sm" color="muted" className="ml-auto shrink-0">
          {/*
            aria-live so the count is announced when filters change. Removing a
            chip is otherwise a silent change for a screen reader user — the row
            they were reading simply becomes a different row.
          */}
          <span aria-live="polite">
            <span className="text-primary font-medium">{resultCount.toLocaleString()}</span>
            {totalCount !== undefined ? ` of ${totalCount.toLocaleString()}` : ''} findings
          </span>
        </Typography>
      ) : null}
    </div>
  );
}
