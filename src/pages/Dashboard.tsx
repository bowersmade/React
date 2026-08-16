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
  severityCount,
} from '../utils/helpers/aggregate';
import { useMemo } from 'react';

// ── Still static ────────────────────────────────────────────────────────────
// Everything here depends on a kaiStatus tally that has not been written yet:
// how many findings each toggle would hide, and the share already dismissed.
// One more aggregate over `kaiStatus` replaces all four.
const METRICS = {
  cleared: '12.3%',
  clearedDetail: '29,005 of 236,656 dismissed',
  clearedPercent: 12.3,
};

const HIDDEN_MANUAL = 17046;
const HIDDEN_AI = 11959;
// ────────────────────────────────────────────────────────────────────────────

/** Share of `total`, as a rounded percentage. Guards the empty-data case. */
const share = (part: number, total: number) => (total ? (part / total) * 100 : 0);

export default function Dashboard() {
  const { data: vulnerabilites, meta, error, isLoading } = useVulnerabilities();

  // ── Derived ───────────────────────────────────────────────────────────────
  // Each runs one pass over the records. Once filters land, swap `vulnerabilites`
  // for the filtered array and everything below follows automatically.
  const trendData = useMemo(() => buildTrendAnalysis(vulnerabilites), [vulnerabilites]);

  const severityCountData = useMemo(() => severityCount(vulnerabilites), [vulnerabilites]);

  const riskFactors = useMemo(() => rankRiskVectors(vulnerabilites), [vulnerabilites]);

  const { groups, repos } = useMemo(
    () => groupRepoOptions(vulnerabilites, meta),
    [vulnerabilites, meta]
  );

  const total = vulnerabilites.length;

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
          detail={`${share(severityCountData.critical, total).toFixed(1)}% of total`}
          tone="critical"
          progress={share(severityCountData.critical, total)}
          loading={isLoading}
          // onClick={() => goToList('severity=critical')}
        />
        <MetricTile
          label="High Severity"
          value={severityCountData.high.toLocaleString()}
          detail={`${share(severityCountData.high, total).toFixed(1)}% of total`}
          tone="high"
          progress={share(severityCountData.high, total)}
          loading={isLoading}
          // onClick={() => goToList('severity=high')}
        />
        <MetricTile
          label="Cleared by Review"
          value={METRICS.cleared}
          detail={METRICS.clearedDetail}
          icon={Database}
          tone="info"
          progress={METRICS.clearedPercent}
          // loading={loading}
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
            hiddenCount={HIDDEN_MANUAL}
            active={false}
            onToggle={() => {}}
            // active={hideManuallyCleared}
            // onToggle={() => dispatch(toggleManuallyCleared())}
          />
          <FilterToggle
            label="AI Analysis"
            icon={Sparkles}
            hiddenCount={HIDDEN_AI}
            active={false}
            onToggle={() => {}}
            // active={hideAiCleared}
            // onToggle={() => dispatch(toggleAiCleared())}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="mt-6 space-y-4">
        <TrendChart data={trendData} loading={isLoading} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SeverityDonut counts={severityCountData} loading={isLoading} />
          <RiskVectors factors={riskFactors} total={total} loading={isLoading} />
        </div>
      </section>
    </>
  );
}
