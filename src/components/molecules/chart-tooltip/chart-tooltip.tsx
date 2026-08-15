import { Typography } from '../../foundations/typography/typography';

export interface TooltipRow {
  key: string;
  label: string;
  /** Literal colour for the swatch, e.g. '#DC2626'. */
  color: string;
  value: number;
}

export interface ChartTooltipProps {
  title: string;
  rows: TooltipRow[];
  /** Optional line under the rows, e.g. a total. */
  footer?: string;
}

/**
 * Shared readout for every chart hover state. Recharts passes its own payload
 * shape per chart type, so each chart maps that into `rows` before rendering.
 */
export default function ChartTooltip({ title, rows, footer }: ChartTooltipProps) {
  return (
    <div className="panel min-w-44 rounded-lg px-3 py-2.5">
      <Typography size="caption" color="muted" className="block uppercase">
        {title}
      </Typography>

      <div className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
                aria-hidden="true"
              />
              <Typography size="body-sm" color="secondary">
                {row.label}
              </Typography>
            </span>
            <Typography size="mono-sm">{row.value.toLocaleString()}</Typography>
          </div>
        ))}
      </div>

      {footer ? (
        <Typography size="caption" color="muted" className="border-line mt-2 block border-t pt-2">
          {footer}
        </Typography>
      ) : null}
    </div>
  );
}
