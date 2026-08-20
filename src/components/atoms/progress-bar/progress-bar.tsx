import { cn } from '../../../utils/cn';

const toneMap = {
  accent: 'bg-accent',
  info: 'bg-info',
  critical: 'bg-critical',
  high: 'bg-high',
  medium: 'bg-medium',
  low: 'bg-low',
  resolved: 'bg-resolved',
  teal: 'bg-teal',
  muted: 'bg-secondary',
} as const;

const sizeMap = {
  sm: 'h-1',
  md: 'h-2',
} as const;

export interface ProgressBarProps {
  /** 0–100. Values outside the range are clamped. */
  value: number;
  tone?: keyof typeof toneMap;
  size?: keyof typeof sizeMap;
  /** Accessible description, e.g. "Network attack vector: 76%". */
  label?: string;
  className?: string;
}

export default function ProgressBar({
  value,
  tone = 'accent',
  size = 'md',
  label,
  className = '',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      data-testid="sn-progress-bar"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-tint/10', sizeMap[size], className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300', toneMap[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
