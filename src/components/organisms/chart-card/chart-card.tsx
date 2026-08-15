import type { ReactNode } from 'react';
import { Typography } from '../../foundations/typography/typography';
import Card from '../../atoms/card/card';
import Skeleton from '../../atoms/skeleton/skeleton';
import StateMessage from '../../molecules/state-message/state-message';
import { cn } from '../../../utils/cn';

export interface ChartCardProps {
  title: string;
  /** One line of context under the title. */
  subtitle?: string;
  /** Rendered top-right — legends, range controls, actions. */
  action?: ReactNode;
  loading?: boolean;
  /** True when the current filters produce no data to plot. */
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Fixed height for the plot area so loading and loaded states don't jump. */
  bodyHeight?: number;
  className?: string;
  children?: ReactNode;
}

/**
 * Shared shell for every chart on the dashboard: header, plus the loading and
 * empty states. The chart itself is passed as children so each chart only has
 * to know how to draw itself.
 *
 * There is no error state here on purpose — the app loads one dataset for the
 * whole page, so a failure is page-level, not per-chart.
 */
export default function ChartCard({
  title,
  subtitle,
  action,
  loading = false,
  empty = false,
  emptyTitle = 'Nothing to plot',
  emptyDescription = 'No findings match the current filters. Try widening the range.',
  bodyHeight = 280,
  className = '',
  children,
}: ChartCardProps) {
  return (
    <Card className={cn('flex flex-col p-6', className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <Typography size="h2">{title}</Typography>
          {subtitle ? (
            <Typography size="body-sm" color="muted" className="mt-1">
              {subtitle}
            </Typography>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div style={{ minHeight: bodyHeight }} className="flex flex-1 flex-col justify-center">
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton shape="block" style={{ height: bodyHeight - 40 }} className="w-full" />
            <div className="flex gap-3">
              <Skeleton className="w-24" />
              <Skeleton className="w-20" />
              <Skeleton className="w-28" />
            </div>
          </div>
        ) : empty ? (
          <StateMessage title={emptyTitle} description={emptyDescription} />
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
