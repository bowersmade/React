import { Typography } from '../../foundations/typography/typography';
import { cn } from '../../../utils/cn';

export interface LegendItem {
  /** Stable key, e.g. "critical". */
  id: string;
  label: string;
  /** Tailwind background class for the color, e.g. "bg-critical". */
  color: string;
  /** Optional figure shown after the label. */
  count?: number;
  /** Optional share of the whole, 0–100. */
  percent?: number;
}

export interface ChartLegendProps {
  items: LegendItem[];
  /** ids currently hidden from the chart. Omit for a static legend. */
  hidden?: string[];
  /** Makes each item a toggle that shows/hides its series. */
  onToggle?: (id: string) => void;
  /** 'row' for pills under a chart title, 'column' beside a donut. */
  direction?: 'row' | 'column';
  className?: string;
}

export default function ChartLegend({
  items,
  hidden = [],
  onToggle,
  direction = 'column',
  className = '',
}: ChartLegendProps) {
  const interactive = Boolean(onToggle);

  return (
    <ul
      data-testid="sn-chart-legend"
      className={cn(
        'flex',
        direction === 'row' ? 'flex-wrap items-center gap-2' : 'flex-col gap-3',
        className
      )}
    >
      {items.map((item) => {
        const isHidden = hidden.includes(item.id);

        const content = (
          <>
            <span
              className={cn('h-2 w-2 shrink-0 rounded-full', item.color)}
              aria-hidden="true"
            />
            <Typography size="body-sm" color={isHidden ? 'disabled' : 'secondary'}>
              {item.label}
              {item.percent !== undefined ? ` (${item.percent.toFixed(1)}%)` : ''}
            </Typography>
            {item.count !== undefined ? (
              <Typography
                size="mono-sm"
                color={isHidden ? 'disabled' : 'muted'}
                className={direction === 'column' ? 'ml-auto' : ''}
              >
                {item.count.toLocaleString()}
              </Typography>
            ) : null}
          </>
        );

        return (
          <li key={item.id} className={direction === 'column' ? 'w-full' : ''}>
            {interactive ? (
              <button
                type="button"
                aria-pressed={!isHidden}
                onClick={() => onToggle?.(item.id)}
                className={cn(
                  'rounded-pill focus-visible:ring-accent focus-visible:ring-offset-page flex w-full items-center gap-2 border px-3 py-1.5 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  isHidden
                    ? 'border-transparent bg-white/[0.03] opacity-60'
                    : 'border-line bg-white/[0.06] hover:bg-white/[0.1]'
                )}
              >
                {content}
              </button>
            ) : (
              <span className="flex w-full items-center gap-2">{content}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
