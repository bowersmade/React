import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarRange, ListFilter, Sigma, TrendingUp } from 'lucide-react';

import Button from '../components/atoms/button/button';
import FilterBar from '../components/molecules/filter-bar/filter-bar';
import MetricTile from '../components/molecules/metric-tile/metric-tile';
import TrendChart from '../components/organisms/trend-chart/trend-chart';
import { Typography } from '../components/foundations/typography/typography';
import { useVulnerabilities } from '../context/vulnerabilitiesContext';
import { useFilters } from '../utils/hooks/useFilters';
import { buildTrendAnalysis, filterData } from '../utils/helpers/aggregate';
import { cn } from '../utils/cn';
import type { TrendPoint } from '../utils/types/data';

/**
 * The full trend view.
 *
 * Same `buildTrendAnalysis` the dashboard uses, but over the whole history
 * rather than the recent window, and driven by whatever filters the list page
 * was carrying — those live in the URL, so arriving here with a query string
 * already applies them.
 */

/**
 * `null` means the entire history. The named windows are month counts, applied
 * as a tail slice: `buildTrendAnalysis` returns points in ascending order and
 * only for months that actually have findings, so "24 months" means the last 24
 * populated months rather than a calendar span. Close enough for a trend, and
 * it avoids inventing empty points for gaps the scanner never covered.
 */
const RANGES: { label: string; months: number | null }[] = [
  { label: '12M', months: 12 },
  { label: '24M', months: 24 },
  { label: '5Y', months: 60 },
  { label: 'All', months: null },
];

const monthLabel = (month: string) => {
  const [year, index] = month.split('-');
  const date = new Date(Number(year), Number(index) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const pointTotal = (point: TrendPoint) => point.critical + point.high + point.medium + point.low;

export default function TrendAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: vulnerabilites, isLoading } = useVulnerabilities();

  const {
    group,
    repo,
    hideManuallyCleared,
    hideAiCleared,
    hideUnreviewed,
    severities,
    from,
    to,
    appliedFilters,
    removeFilter,
    clearFilters,
    isApplyingFilters,
  } = useFilters();

  const [rangeMonths, setRangeMonths] = useState<number | null>(null);

  const visible = useMemo(
    () =>
      filterData(vulnerabilites, {
        group,
        repo,
        hideManuallyCleared,
        hideAiCleared,
        severities,
        hideUnreviewed,
        to,
        from,
      }),
    [
      vulnerabilites,
      group,
      repo,
      hideManuallyCleared,
      hideAiCleared,
      severities,
      hideUnreviewed,
      to,
      from,
    ]
  );

  // Built over the full filtered set once, then sliced per range. Re-bucketing
  // 236k records every time someone taps 12M would be a full pass for a result
  // that is a suffix of one we already have.
  const allPoints = useMemo(() => buildTrendAnalysis(visible), [visible]);

  const points = useMemo(
    () => (rangeMonths === null ? allPoints : allPoints.slice(-rangeMonths)),
    [allPoints, rangeMonths]
  );

  const summary = useMemo(() => {
    let total = 0;
    let critical = 0;
    let peak: TrendPoint | null = null;

    for (const point of points) {
      const monthly = pointTotal(point);
      total += monthly;
      critical += point.critical;
      if (peak === null || monthly > pointTotal(peak)) peak = point;
    }

    return {
      total,
      critical,
      peak,
      // Mean per populated month — see the note on RANGES about gaps.
      average: points.length ? Math.round(total / points.length) : 0,
    };
  }, [points]);

  const goToList = () => navigate({ pathname: '/vulnerabilities', search: location.search });

  const rangeSubtitle =
    points.length > 0
      ? `${monthLabel(points[0].month)} – ${monthLabel(points[points.length - 1].month)}`
      : 'No findings in this range';

  return (
    <div className="flex flex-col gap-5">
      <FilterBar filters={appliedFilters} onRemove={removeFilter} onClear={clearFilters} />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-0.5">
          <Typography size="h2" as="h1">
            Trend Analysis
          </Typography>
          <Typography size="body-sm" color="muted">
            {allPoints.length.toLocaleString()} months of history — showing {rangeSubtitle}
          </Typography>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" icon={ListFilter} onClick={goToList}>
            View Findings
          </Button>
        </div>
      </div>

      {/*
        Above the chart, not in ChartCard's `action` slot — the legend already
        owns that corner, and two control clusters in one header row read as a
        single undifferentiated strip of buttons.
      */}
      <div className="flex flex-wrap items-center gap-2">
        <Typography size="caption" color="muted" as="span" className="uppercase">
          Range
        </Typography>
        {RANGES.map((range) => {
          const active = range.months === rangeMonths;
          // A window longer than the history plots the same points as All, so
          // offering it would be a button that visibly does nothing.
          const redundant = range.months !== null && range.months >= allPoints.length;

          return (
            <Button
              key={range.label}
              size="sm"
              variant={active ? 'primary' : 'ghost'}
              disabled={redundant && !active}
              aria-pressed={active}
              onClick={() => setRangeMonths(range.months)}
            >
              {range.label}
            </Button>
          );
        })}
      </div>

      <TrendChart
        data={points}
        loading={isLoading}
        subtitle={`New findings identified per month, by severity — ${rangeSubtitle}`}
      />

      {/*
        Below the chart, per the design. These summarise what the chart already
        shows, so they read as a footer to it rather than a header to the page —
        you look at the shape first, then the figures behind it.
      */}
      <section
        aria-busy={isApplyingFilters || undefined}
        className={cn(
          'grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-4',
          isApplyingFilters && 'opacity-50'
        )}
      >
        <MetricTile
          label="Findings in range"
          value={summary.total.toLocaleString()}
          detail={points.length ? `across ${points.length} months` : undefined}
          icon={Sigma}
          loading={isLoading}
          onClick={goToList}
        />
        <MetricTile
          label="Critical in range"
          value={summary.critical.toLocaleString()}
          detail={
            summary.total
              ? `${((summary.critical / summary.total) * 100).toFixed(1)}% of the range`
              : undefined
          }
          tone="critical"
          loading={isLoading}
          onClick={goToList}
        />
        <MetricTile
          label="Busiest month"
          value={summary.peak ? monthLabel(summary.peak.month) : '—'}
          detail={
            summary.peak ? `${pointTotal(summary.peak).toLocaleString()} findings` : undefined
          }
          icon={TrendingUp}
          tone="high"
          loading={isLoading}
        />
        <MetricTile
          label="Monthly average"
          value={summary.average.toLocaleString()}
          detail="per month with findings"
          icon={CalendarRange}
          tone="info"
          loading={isLoading}
        />
      </section>
    </div>
  );
}
