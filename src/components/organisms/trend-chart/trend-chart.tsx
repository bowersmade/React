import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartCard from '../chart-card/chart-card';
import ChartLegend from '../../molecules/chart-legend/chart-legend';
import ChartTooltip from '../../molecules/chart-tooltip/chart-tooltip';
import { Typography } from '../../foundations/typography/typography';
import {
  chartChrome,
  chartColors,
  chartColorClasses,
  severityLabels,
} from '../../../utils/chart-colors';
import { severityOrder, SeverityKey, TrendPoint } from '../../../utils/types/data';

export interface TrendChartProps {
  data: TrendPoint[];
  loading?: boolean;
  className?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonth(value: string) {
  const [year, month] = value.split('-');
  const index = Number(month) - 1;
  return MONTHS[index] ? `${MONTHS[index]} ${year.slice(2)}` : value;
}

function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

export default function TrendChart({ data, loading = false, className = '' }: TrendChartProps) {
  const [hidden, setHidden] = useState<string[]>([]);

  const visible = useMemo(() => severityOrder.filter((key) => !hidden.includes(key)), [hidden]);

  const legendItems = useMemo(
    () =>
      severityOrder.map((key) => ({
        id: key,
        label: severityLabels[key],
        color: chartColorClasses[key],
        count: data.reduce((sum, point) => sum + (point[key] ?? 0), 0),
      })),
    [data]
  );

  const toggle = (id: string) =>
    setHidden((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));

  // A line needs at least two points to describe a trend.
  const sparse = data.length > 0 && data.length < 3;

  return (
    <ChartCard
      title="Vulnerability Trend"
      subtitle="New findings identified per month, by severity"
      bodyHeight={340}
      loading={loading}
      empty={data.length === 0}
      emptyTitle="No findings in this range"
      emptyDescription="Widen the time range or clear a filter to see a trend."
      action={<ChartLegend items={legendItems} hidden={hidden} onToggle={toggle} direction="row" />}
      className={className}
    >
      {sparse ? (
        <Typography size="body-sm" color="muted" className="mb-3 block">
          Only {data.length} data {data.length === 1 ? 'point' : 'points'} in this range — too few
          to read as a trend.
        </Typography>
      ) : null}

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              {severityOrder.map((key) => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors[key]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={chartColors[key]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid stroke={chartChrome.grid} vertical={false} />

            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              stroke={chartChrome.axis}
              tick={{ fill: chartChrome.axisText, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={formatCount}
              stroke={chartChrome.axis}
              tick={{ fill: chartChrome.axisText, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />

            <Tooltip
              cursor={{ stroke: chartChrome.axis, strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const rows = payload
                  .filter((p) => p.dataKey && visible.includes(p.dataKey as SeverityKey))
                  .map((p) => {
                    const key = p.dataKey as SeverityKey;
                    return {
                      key,
                      label: severityLabels[key],
                      color: chartColors[key],
                      value: Number(p.value ?? 0),
                    };
                  });
                const total = rows.reduce((sum, r) => sum + r.value, 0);
                return (
                  <ChartTooltip
                    title={formatMonth(String(label))}
                    rows={rows}
                    footer={`${total.toLocaleString()} total`}
                  />
                );
              }}
            />

            {visible.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[key]}
                strokeWidth={2}
                fill={`url(#fill-${key})`}
                isAnimationActive={false}
                dot={sparse ? { r: 3, fill: chartColors[key], strokeWidth: 0 } : false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
