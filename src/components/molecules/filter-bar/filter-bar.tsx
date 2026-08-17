import { SlidersHorizontal } from 'lucide-react';
import Chip from '../../atoms/chip/chip';
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
  className?: string;
}

/**
 * The strip of applied filters above the feed.
 *
 * Its job is answering "why am I seeing these rows" at a glance, so it always
 * occupies its slot — a bar that appeared and disappeared would shift the table
 * underneath it every time the last filter came off.
 *
 * Add Filter carries a count badge so the number of active filters is legible
 * even when the chips overflow, and Clear All sits at the far right, away from
 * the individual remove buttons — destructive-ish actions should not be adjacent
 * to the ones they resemble.
 */
export default function FilterBar({
  filters,
  onRemove,
  onClear,
  onAddFilter,
  className = '',
}: FilterBarProps) {
  const hasFilters = filters.length > 0;

  return (
    <div
      data-testid="sn-filter-bar"
      className={cn(
        'glass rounded-pill flex flex-wrap items-center gap-2 px-2 py-2 pr-4',
        className
      )}
    >
      {onAddFilter ? (
        <>
          <button
            type="button"
            onClick={onAddFilter}
            className="rounded-pill focus-visible:ring-accent focus-visible:ring-offset-page text-body-sm text-primary flex shrink-0 items-center gap-2 bg-white/[0.08] px-3.5 py-1.5 font-sans font-medium transition-colors duration-150 hover:bg-white/[0.14] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            Add Filter
            {hasFilters ? (
              <span className="bg-accent text-page text-caption flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-semibold">
                {filters.length}
              </span>
            ) : null}
          </button>

          <span className="bg-line mx-1 h-6 w-px shrink-0" aria-hidden="true" />
        </>
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
        <Typography size="body-sm" color="muted" className="px-1">
          No filters applied — showing everything.
        </Typography>
      )}

      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="text-body-sm text-secondary hover:text-primary focus-visible:ring-accent ml-auto shrink-0 rounded-sm px-1 font-sans font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
        >
          Clear All Filters
        </button>
      ) : null}
    </div>
  );
}
