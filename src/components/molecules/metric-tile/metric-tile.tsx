import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Typography } from '../../foundations/typography/typography';
import Card from '../../atoms/card/card';
import ProgressBar from '../../atoms/progress-bar/progress-bar';
import Skeleton from '../../atoms/skeleton/skeleton';
import { cn } from '../../../utils/cn';

type Tone = 'primary' | 'critical' | 'high' | 'medium' | 'low' | 'info' | 'accent' | 'resolved';

export interface MetricTileProps {
  /** Small uppercase label, e.g. "Critical Vulnerabilities". */
  label: string;
  /** The headline figure. Pre-formatted — pass "1,773" or "12.3%", not a raw number. */
  value: string;
  /** Short supporting line beneath the value, e.g. "+1,204 today". */
  detail?: string;
  icon?: LucideIcon;
  /** Colours the value and the icon. */
  tone?: Tone;
  /** 0–100. Renders a thin fill along the bottom of the tile. */
  progress?: number;
  /** Makes the tile a real button that navigates to the filtered list. */
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

type BarTone = 'accent' | 'critical' | 'high' | 'medium' | 'low' | 'info' | 'resolved';

const toneMap: Record<Tone, { text: string; bar: BarTone }> = {
  primary: { text: 'text-primary', bar: 'accent' },
  critical: { text: 'text-critical', bar: 'critical' },
  high: { text: 'text-high', bar: 'high' },
  medium: { text: 'text-medium', bar: 'medium' },
  low: { text: 'text-low', bar: 'low' },
  info: { text: 'text-info', bar: 'info' },
  accent: { text: 'text-accent', bar: 'accent' },
  resolved: { text: 'text-resolved', bar: 'resolved' },
};

export default function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'primary',
  progress,
  onClick,
  loading = false,
  className = '',
}: MetricTileProps) {
  const { text, bar } = toneMap[tone];
  const interactive = Boolean(onClick);

  if (loading) {
    return (
      <Card className={cn('relative overflow-hidden p-6', className)}>
        <Skeleton className="w-32" />
        <Skeleton shape="block" className="mt-4 h-9 w-28" />
        <Skeleton className="mt-3 w-20" />
      </Card>
    );
  }

  return (
    <Card
      as={interactive ? 'button' : 'div'}
      interactive={interactive}
      onClick={onClick}
      className={cn('group relative w-full overflow-hidden p-6', className)}
    >
      <span className="flex items-start justify-between gap-3">
        <Typography size="caption" color="muted" className="uppercase">
          {label}
        </Typography>

        {Icon ? (
          <Icon size={16} className={cn('shrink-0', text)} aria-hidden="true" />
        ) : interactive ? (
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="text-muted shrink-0 opacity-40 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100"
          />
        ) : null}
      </span>

      <Typography size="display" className={cn('mt-3 block', text)}>
        {value}
      </Typography>

      {detail ? (
        <Typography size="body-sm" color="muted" className="mt-2 block">
          {detail}
        </Typography>
      ) : null}

      {progress !== undefined ? (
        <span className="absolute inset-x-0 bottom-0 block">
          <ProgressBar value={progress} tone={bar} size="sm" className="rounded-none" />
        </span>
      ) : null}
    </Card>
  );
}
