import { cn } from '../../../utils/cn';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

const severityMap: Record<Severity, { chip: string; dot: string; label: string }> = {
  critical: {
    chip: 'bg-critical-tint text-critical border-critical/30',
    dot: 'bg-critical',
    label: 'Critical',
  },
  high: {
    chip: 'bg-high-tint text-high border-high/30',
    dot: 'bg-high',
    label: 'High',
  },
  medium: {
    chip: 'bg-medium-tint text-medium border-medium/30',
    dot: 'bg-medium',
    label: 'Medium',
  },
  low: {
    chip: 'bg-low-tint text-low border-low/40',
    dot: 'bg-low',
    label: 'Low',
  },
};

export interface SeverityBadgeProps {
  severity: Severity;
  /** Leading dot in the severity colour. */
  showDot?: boolean;
  className?: string;
}

export default function SeverityBadge({
  severity,
  showDot = true,
  className = '',
}: SeverityBadgeProps) {
  const { chip, dot, label } = severityMap[severity];

  return (
    <span
      data-testid="sn-severity-badge"
      className={cn(
        'text-caption rounded-pill inline-flex items-center gap-1.5 border px-2.5 py-1 font-sans font-medium',
        chip,
        className
      )}
    >
      {showDot ? (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} aria-hidden="true" />
      ) : null}
      {label}
    </span>
  );
}
