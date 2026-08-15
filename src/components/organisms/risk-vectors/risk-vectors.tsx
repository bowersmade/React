import { useMemo } from 'react';
import { Typography } from '../../foundations/typography/typography';
import ProgressBar from '../../atoms/progress-bar/progress-bar';
import ChartCard from '../chart-card/chart-card';

export interface RiskFactor {
  label: string;
  count: number;
}

export interface RiskVectorsProps {
  /** Risk factor label -> frequency. Ranked and truncated internally. */
  factors: RiskFactor[];
  /** Denominator for the percentages — usually the total findings in scope. */
  total: number;
  /** How many bars to show. */
  limit?: number;
  loading?: boolean;
  className?: string;
}

export default function RiskVectors({
  factors,
  total,
  limit = 6,
  loading = false,
  className = '',
}: RiskVectorsProps) {
  const top = useMemo(
    () => [...factors].sort((a, b) => b.count - a.count).slice(0, limit),
    [factors, limit]
  );

  return (
    <ChartCard
      title="Top Risk Factors"
      subtitle="Attack characteristics most often present in findings"
      bodyHeight={240}
      loading={loading}
      empty={top.length === 0}
      emptyTitle="No risk factors recorded"
      emptyDescription="Findings in this scope have no risk factor data attached."
      className={className}
    >
      <ul className="space-y-4">
        {top.map((factor) => {
          const percent = total ? (factor.count / total) * 100 : 0;
          return (
            <li key={factor.label}>
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <Typography size="body-sm" color="secondary" className="truncate">
                  {factor.label}
                </Typography>
                <span className="flex shrink-0 items-baseline gap-2">
                  <Typography size="mono-sm" color="muted">
                    {factor.count.toLocaleString()}
                  </Typography>
                  <Typography size="mono-sm">{percent.toFixed(0)}%</Typography>
                </span>
              </div>
              <ProgressBar
                value={percent}
                tone="accent"
                size="sm"
                label={`${factor.label}: ${percent.toFixed(0)}%`}
              />
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
