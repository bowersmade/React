import { cn } from '../../../utils/cn';

const toneMap = {
  neutral: 'bg-white/[0.08] text-secondary border-line',
  info: 'bg-info-tint text-info border-info/30',
  resolved: 'bg-resolved/15 text-resolved border-resolved/30',
  accent: 'bg-accent/15 text-accent border-accent/30',
} as const;

export interface BadgeProps {
  tone?: keyof typeof toneMap;
  /** Renders in monospace — package types, versions. */
  mono?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Small status label for anything that is not a severity — review verdicts
 * ("Dismissed", "AI cleared"), package types ("jar", "npm"), fix availability.
 *
 * Severity has its own component because its four tones are fixed and carry
 * meaning; this one is deliberately generic.
 */
export default function Badge({ tone = 'neutral', mono = false, className = '', children }: BadgeProps) {
  return (
    <span
      data-testid="sn-badge"
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 font-medium',
        mono ? 'text-mono-sm font-mono' : 'text-caption font-sans',
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
