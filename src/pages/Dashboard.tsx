import { BarChart3, Database, ShieldAlert, Sparkles } from 'lucide-react';

import MetricTile from '../components/molecules/metric-tile/metric-tile';
import ScopeSelect from '../components/molecules/scope-select/scope-select';
import FilterToggle from '../components/atoms/filter-toggle/filter-toggle';
import TrendChart from '../components/organisms/trend-chart/trend-chart';
import SeverityDonut from '../components/organisms/severity-donut/severity-donut';
import RiskVectors from '../components/organisms/risk-vectors/risk-vectors';
import { useVulnerabilities } from '../context/vulnerabilitiesContext';
import {
  buildTrendAnalysis,
  groupRepoOptions,
  rankRiskVectors,
  reviewCount,
  severityCount,
} from '../utils/helpers/aggregate';
import { useMemo } from 'react';
import { DASHBOARD_TREND_MONTHS } from '../utils/types/data';

/**
 * `part` expressed as a percentage of `total`, e.g. (1773, 236656) -> 0.749.
 * Returns the raw number; callers round it. Zero total returns 0 rather than
 * NaN, which is what 0/0 gives and what would render during the initial load.
 */
const percentOf = (part: number, total: number) => (total ? (part / total) * 100 : 0);

/**
 * Months of history shown on the dashboard chart.
 *
 * The dataset spans 118 months, back to 2015. Plotted whole in this card the
 * line is an unreadable smear and the axis drops most of its labels, so the
 * glance view takes the recent window and the Trend Analysis page gets the
 * full history.
 *
 * This slices the last N months *present in the data*, not the last N calendar
 * months — a gap month simply is not a key, so a quiet period shifts the window
 * further back rather than leaving a hole.
 */

export default function Dashboard() {
  const { data: vulnerabilites, meta, isLoading } = useVulnerabilities();

  // ── Derived ───────────────────────────────────────────────────────────────
  // Each runs one pass over the records. Once filters land, swap `vulnerabilites`
  // for the filtered array and everything below follows automatically.
  const trendData = useMemo(
    () => buildTrendAnalysis(vulnerabilites).slice(-DASHBOARD_TREND_MONTHS),
    [vulnerabilites]
  );

  const severityCountData = useMemo(() => severityCount(vulnerabilites), [vulnerabilites]);

  const riskFactors = useMemo(() => rankRiskVectors(vulnerabilites), [vulnerabilites]);

  const { groups, repos } = useMemo(
    () => groupRepoOptions(vulnerabilites, meta),
    [vulnerabilites, meta]
  );

  const { aiCleared, manuallyCleared } = useMemo(
    () => reviewCount(vulnerabilites),
    [vulnerabilites]
  );

  const total = vulnerabilites.length;
  const cleared = aiCleared + manuallyCleared;

  // ── Navigation ────────────────────────────────────────────────────────────
  // const navigate = useNavigate();
  // const goToList = (params: string) => navigate(`/vulnerabilities?${params}`);

  return (
    <>
      {/* Metrics — each tile navigates to the list, pre-filtered. */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total Vulnerabilities"
          value={total.toLocaleString()}
          detail={`${meta.imageCount.toLocaleString()} images scanned`}
          icon={ShieldAlert}
          loading={isLoading}
          // onClick={() => goToList('')}
        />
        <MetricTile
          label="Critical"
          value={severityCountData.critical.toLocaleString()}
          detail={`${percentOf(severityCountData.critical, total).toFixed(1)}% of total`}
          tone="critical"
          progress={percentOf(severityCountData.critical, total)}
          loading={isLoading}
          // onClick={() => goToList('severity=critical')}
        />
        <MetricTile
          label="High Severity"
          value={severityCountData.high.toLocaleString()}
          detail={`${percentOf(severityCountData.high, total).toFixed(1)}% of total`}
          tone="high"
          progress={percentOf(severityCountData.high, total)}
          loading={isLoading}
          // onClick={() => goToList('severity=high')}
        />
        <MetricTile
          label="Cleared by Review"
          value={`${percentOf(cleared, total).toFixed(1)}%`}
          detail={`${cleared.toLocaleString()} of ${total.toLocaleString()} dismissed`}
          icon={Database}
          tone="info"
          progress={percentOf(cleared, total)}
          loading={isLoading}
          // onClick={() => goToList('reviewed=true')}
        />
      </section>

      {/* Controls — scope on the left, the two spec-required toggles on the right. */}
      <section className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
          <ScopeSelect
            label="Group"
            options={groups}
            allLabel={`All Groups (${groups.length})`}
            searchPlaceholder={`Search ${groups.length} groups…`}
            value={null}
            onChange={() => {}}
            // value={group}
            // onChange={(id) => dispatch(setGroup(id))}
          />
          <ScopeSelect
            label="Repository"
            options={repos}
            allLabel={`All Repositories (${repos.length})`}
            searchPlaceholder="Search repositories…"
            mono
            value={null}
            onChange={() => {}}
            // value={repo}
            // onChange={(id) => dispatch(setRepo(id))}
          />
        </div>

        <div className="flex shrink-0 items-start gap-3">
          <FilterToggle
            label="Analysis"
            icon={BarChart3}
            hiddenCount={manuallyCleared}
            active={false}
            onToggle={() => {}}
            // active={hideManuallyCleared}
            // onToggle={() => dispatch(toggleManuallyCleared())}
          />
          <FilterToggle
            label="AI Analysis"
            icon={Sparkles}
            hiddenCount={aiCleared}
            active={false}
            onToggle={() => {}}
            // active={hideAiCleared}
            // onToggle={() => dispatch(toggleAiCleared())}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="mt-6 space-y-4">
        <TrendChart
          data={trendData}
          subtitle={`New findings by severity — last ${DASHBOARD_TREND_MONTHS} months`}
          loading={isLoading}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SeverityDonut counts={severityCountData} loading={isLoading} />
          <RiskVectors factors={riskFactors} total={total} loading={isLoading} />
        </div>
      </section>
    </>
  );
}
