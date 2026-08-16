import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Typography } from '../../foundations/typography/typography';
import ChartCard from '../chart-card/chart-card';
import ChartLegend from '../../molecules/chart-legend/chart-legend';
import { chartColors, chartColorClasses, severityLabels } from '../../../utils/chart-colors';
import { SeverityKey, severityOrder } from '../../../utils/types/data';

export interface SeverityDonutProps {
  /** Vulnerability count per severity. */
  counts: Record<SeverityKey, number>;
  loading?: boolean;
  className?: string;
}

export default function SeverityDonut({
  counts,
  loading = false,
  className = '',
}: SeverityDonutProps) {
  const [hidden, setHidden] = useState<string[]>([]);

  const total = useMemo(
    () => severityOrder.reduce((sum, key) => sum + (counts[key] ?? 0), 0),
    [counts]
  );

  const legendItems = useMemo(
    () =>
      severityOrder.map((key) => ({
        id: key,
        label: severityLabels[key],
        color: chartColorClasses[key],
        count: counts[key] ?? 0,
        percent: total ? ((counts[key] ?? 0) / total) * 100 : 0,
      })),
    [counts, total]
  );

  // Hiding a slice removes it from the ring and from the centre total, so the
  // percentages always describe what is actually on screen.
  const slices = useMemo(
    () =>
      severityOrder
        .filter((key) => !hidden.includes(key))
        .map((key) => ({
          key,
          name: severityLabels[key],
          value: counts[key] ?? 0,
          color: chartColors[key],
        }))
        .filter((slice) => slice.value > 0),
    [counts, hidden]
  );

  const visibleTotal = slices.reduce((sum, s) => sum + s.value, 0);

  const toggle = (id: string) =>
    setHidden((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));

  return (
    <ChartCard
      title="Severity Distribution"
      subtitle="Findings by severity across the current scope"
      loading={loading}
      empty={total === 0}
      emptyTitle="No findings in scope"
      emptyDescription="Nothing matches the selected group, repository and filters."
      className={className}
    >
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center">
        <div className="relative h-[200px] w-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.key} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centre total, layered over the ring's hole. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <Typography size="h1">{visibleTotal.toLocaleString()}</Typography>
            <Typography size="caption" color="muted" className="uppercase">
              {hidden.length ? 'Visible' : 'Findings'}
            </Typography>
          </div>
        </div>

        <ChartLegend
          items={legendItems}
          hidden={hidden}
          onToggle={toggle}
          direction="column"
          className="w-full lg:max-w-xs"
        />
      </div>
    </ChartCard>
  );
}
