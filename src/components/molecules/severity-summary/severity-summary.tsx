import { severityOrder, type SeverityKey } from '../../../utils/types/data';
import { cn } from '../../../utils/cn';

const toneMap: Record<SeverityKey, { chip: string; dot: string; label: string }> = {
  critical: { chip: 'bg-critical-tint text-critical', dot: 'bg-critical', label: 'Critical' },
  high: { chip: 'bg-high-tint text-high', dot: 'bg-high', label: 'High' },
  medium: { chip: 'bg-medium-tint text-medium', dot: 'bg-medium', label: 'Med' },
  low: { chip: 'bg-low-tint text-low', dot: 'bg-low', label: 'Low' },
};

export interface SeveritySummaryProps {
  counts: Record<SeverityKey, number>;
  /** Clicking a pill filters to that severity. Omit for a read-only breakdown. */
  onSelect?: (severity: SeverityKey) => void;
  /** Which pill reads as pressed, when the list is already filtered to one. */
  activeSeverity?: SeverityKey | null;
  className?: string;
}

/**
 * The severity breakdown beside the total, e.g. "1,415 Critical · 8,203 High".
 *
 * Always renders all four, including zeroes. A missing pill and a zero mean
 * different things — "no critical findings here" is the single most reassuring
 * thing this screen can say, and it can only say it by showing the zero.
 */
export default function SeveritySummary({
  counts,
  onSelect,
  activeSeverity = null,
  className = '',
}: SeveritySummaryProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {severityOrder.map((severity) => {
        const { chip, dot, label } = toneMap[severity];
        const content = (
          <>
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} aria-hidden="true" />
            <span className="font-semibold">{counts[severity].toLocaleString()}</span>
            {label}
          </>
        );

        const shared = cn(
          'rounded-pill text-caption inline-flex items-center gap-1.5 px-2.5 py-1 font-sans',
          chip
        );

        if (!onSelect) {
          return (
            <span key={severity} className={shared}>
              {content}
            </span>
          );
        }

        return (
          <button
            key={severity}
            type="button"
            onClick={() => onSelect(severity)}
            aria-pressed={activeSeverity === severity}
            className={cn(
              shared,
              'focus-visible:ring-accent focus-visible:ring-offset-page transition-opacity duration-150 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              activeSeverity === severity && 'ring-2 ring-current ring-offset-0'
            )}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
