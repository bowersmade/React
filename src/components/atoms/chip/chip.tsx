import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface ChipProps {
  /** Category, shown before the value: "Severity". Omit for a bare value. */
  label?: string;
  /** The value itself: "Critical". */
  value: string;
  icon?: LucideIcon;
  /** Shows a remove button. Leave undefined for a read-only chip. */
  onRemove?: () => void;
  /** Renders the value in monospace — repo names, CVE ids, image paths. */
  mono?: boolean;
  className?: string;
}

/**
 * One applied filter in the filter bar.
 *
 * Reads as "Severity: Critical ×" so a glance down the bar tells you what is
 * narrowing the list, and each chip removes only its own filter. That is the
 * difference from a filter *control* — a chip describes a choice already made.
 */
export default function Chip({
  label,
  value,
  icon: Icon,
  onRemove,
  mono = false,
  className = '',
}: ChipProps) {
  return (
    <span
      data-testid="sn-chip"
      className={cn(
        'border-line text-body-sm inline-flex items-center gap-1.5 rounded-pill border bg-tint/[0.06] py-1 pl-2.5 font-sans',
        onRemove ? 'pr-1' : 'pr-2.5',
        className
      )}
    >
      {Icon ? <Icon size={13} aria-hidden="true" className="text-muted shrink-0" /> : null}

      {label ? <span className="text-muted shrink-0">{label}:</span> : null}

      <span className={cn('text-primary truncate', mono && 'font-mono text-mono-sm')}>{value}</span>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          // The chip text alone would read as "×" to a screen reader, which says
          // nothing about what is being removed.
          aria-label={`Remove filter ${label ? `${label}: ` : ''}${value}`}
          className="text-muted hover:text-primary focus-visible:ring-accent ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-tint/[0.12] focus-visible:ring-2 focus-visible:outline-none"
        >
          <X size={12} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}
