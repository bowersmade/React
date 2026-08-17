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
  filterData,
  groupRepoOptions,
  rankRiskVectors,
  reviewCount,
  severityCount,
} from '../utils/helpers/aggregate';
import { useDeferredValue, useMemo } from 'react';
import { DASHBOARD_TREND_MONTHS } from '../utils/types/data';
import { useFilters } from '../utils/hooks/useFilters';
import { cn } from '../utils/cn';

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
  const { group, repo, hideManuallyCleared, hideAiCleared, setFilter, toggleFilter } = useFilters();

  /**
   * Recomputing everything below costs a few hundred milliseconds over 236k
   * records, and React cannot paint while it runs — so a toggle appeared frozen
   * until the whole chain finished.
   *
   * Deferring the filter values splits that in two. The controls read the live
   * values and respond on the next frame; the expensive work reads the deferred
   * ones and lands when it lands, at a priority React will interrupt if the user
   * clicks again. The numbers are briefly one interaction behind, which `isStale`
   * makes visible rather than hiding.
   */
  const dGroup = useDeferredValue(group);
  const dRepo = useDeferredValue(repo);
  const dHideManuallyCleared = useDeferredValue(hideManuallyCleared);
  const dHideAiCleared = useDeferredValue(hideAiCleared);

  const isStale =
    dGroup !== group ||
    dRepo !== repo ||
    dHideManuallyCleared !== hideManuallyCleared ||
    dHideAiCleared !== hideAiCleared;

  // ── Filtered sets ─────────────────────────────────────────────────────────
  // Two stages on purpose.
  //
  // `inScope` applies only group and repo. It is what the review toggles
  // describe: a button reading "hides 4,211" has to count the findings it would
  // remove, which is impossible once it has already removed them. Counting on
  // the fully filtered set makes an active toggle report zero hidden while it
  // is busy hiding thousands.
  //
  // `filtered` is everything, and drives the charts and metrics.
  const inScope = useMemo(
    () =>
      filterData(vulnerabilites, {
        group: dGroup,
        repo: dRepo,
        hideManuallyCleared: false,
        hideAiCleared: false,
      }),
    [vulnerabilites, dGroup, dRepo]
  );

  const filtered = useMemo(
    () =>
      filterData(inScope, {
        group: null,
        repo: null,
        hideManuallyCleared: dHideManuallyCleared,
        hideAiCleared: dHideAiCleared,
      }),
    [inScope, dHideManuallyCleared, dHideAiCleared]
  );

  // ── Derived ───────────────────────────────────────────────────────────────
  const trendData = useMemo(
    () => buildTrendAnalysis(filtered).slice(-DASHBOARD_TREND_MONTHS),
    [filtered]
  );

  const severityCountData = useMemo(() => severityCount(filtered), [filtered]);

  const riskFactors = useMemo(() => rankRiskVectors(filtered), [filtered]);

  // Scope options describe what picking a scope would show, so they count the
  // fully filtered set — the toggles apply to them like everything else.
  const { groups, repos } = useMemo(() => groupRepoOptions(filtered, meta), [filtered, meta]);

  // Counted before the toggles, per the note above.
  const { aiCleared, manuallyCleared } = useMemo(() => reviewCount(inScope), [inScope]);

  /**
   * Distinct images carrying at least one finding in the current scope.
   *
   * Built with a Set rather than `new Set(inScope.map(...))` so there is no
   * intermediate array of 236k strings to allocate and discard.
   *
   * Note this counts images *affected*, not images *scanned* — an image with no
   * findings has no records, so it cannot appear here. Unfiltered that is 1,025
   * against meta's 1,030 scanned, the difference being five clean images. The
   * label says "affected" for that reason.
   */
  const affectedImages = useMemo(() => {
    const seen = new Set<string>();
    for (const vul of inScope) seen.add(vul.image);
    return seen.size;
  }, [inScope]);

  const total = filtered.length;
  const scopeTotal = inScope.length;
  const cleared = aiCleared + manuallyCleared;

  // ── Navigation ────────────────────────────────────────────────────────────
  // const navigate = useNavigate();
  // const goToList = (params: string) => navigate(`/vulnerabilities?${params}`);

  return (
    <>
      {/*
        Metrics and charts dim while a filter change is still being computed.
        The controls below stay at full strength because they respond
        immediately — the dimming marks what is behind, not what is disabled.
      */}
      <section
        aria-busy={isStale}
        className={cn(
          'grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-4',
          isStale && 'opacity-50'
        )}
      >
        <MetricTile
          label="Total Vulnerabilities"
          value={total.toLocaleString()}
          // Unscoped, the denominator is meaningful: 1,025 of 1,030 images carry
          // findings, so five are clean. Scoped, that denominator is the whole
          // estate rather than the group's, so mixing the two scales would read
          // as "23 of 1,030" and invite the wrong comparison.
          detail={
            dGroup || dRepo
              ? `across ${affectedImages.toLocaleString()} images`
              : `across ${affectedImages.toLocaleString()} of ${meta.imageCount.toLocaleString()} images`
          }
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
        {/*
          Measured against the scope, not the filtered set — hiding the cleared
          findings should not make the review progress read 0%.
        */}
        <MetricTile
          label="Cleared by Review"
          value={`${percentOf(cleared, scopeTotal).toFixed(1)}%`}
          detail={`${cleared.toLocaleString()} of ${scopeTotal.toLocaleString()} dismissed`}
          icon={Database}
          tone="info"
          progress={percentOf(cleared, scopeTotal)}
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
            value={group}
            onChange={(id) => setFilter('group', id)}
          />
          <ScopeSelect
            label="Repository"
            options={repos}
            allLabel={`All Repositories (${repos.length})`}
            searchPlaceholder="Search repositories…"
            mono
            value={repo}
            onChange={(id) => setFilter('repo', id)}
          />
        </div>

        <div className="flex shrink-0 items-start gap-3">
          <FilterToggle
            label="Analysis"
            icon={BarChart3}
            hiddenCount={manuallyCleared}
            active={hideManuallyCleared}
            onToggle={() => toggleFilter('hideManuallyCleared')}
          />
          <FilterToggle
            label="AI Analysis"
            icon={Sparkles}
            hiddenCount={aiCleared}
            active={hideAiCleared}
            onToggle={() => toggleFilter('hideAiCleared')}
          />
        </div>
      </section>

      {/* Charts */}
      <section
        aria-busy={isStale}
        className={cn('mt-6 space-y-4 transition-opacity duration-200', isStale && 'opacity-50')}
      >
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
