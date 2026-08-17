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
import { useFilters } from '../utils/hooks/useFilters';
import { useLocation, useNavigate } from 'react-router-dom';

const percentOf = (part: number, total: number) => (total ? (part / total) * 100 : 0);

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: vulnerabilites, meta, isLoading } = useVulnerabilities();
  const { group, repo, hideManuallyCleared, hideAiCleared, setFilter, toggleFilter } = useFilters();

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

  const goToList = () => navigate({ pathname: '/vulnerabilities', search: location.search });

  return (
    <>
      <section className="grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total Vulnerabilities"
          value={total.toLocaleString()}
          icon={ShieldAlert}
          loading={isLoading}
          onClick={goToList}
        />
        <MetricTile
          label="Critical"
          value={severityCountData.critical.toLocaleString()}
          detail={`${percentOf(severityCountData.critical, total).toFixed(1)}% of total`}
          tone="critical"
          progress={percentOf(severityCountData.critical, total)}
          loading={isLoading}
          onClick={goToList}
        />
        <MetricTile
          label="High Severity"
          value={severityCountData.high.toLocaleString()}
          detail={`${percentOf(severityCountData.high, total).toFixed(1)}% of total`}
          tone="high"
          progress={percentOf(severityCountData.high, total)}
          loading={isLoading}
          onClick={goToList}
        />
        <MetricTile
          label="Cleared by Review"
          value={`${percentOf(aiCleared + manuallyCleared, total).toFixed(1)}%`}
          detail={`${(aiCleared + manuallyCleared).toLocaleString()} of ${total.toLocaleString()} dismissed`}
          icon={Database}
          tone="info"
          progress={percentOf(aiCleared + manuallyCleared, total)}
          loading={isLoading}
          onClick={goToList}
        />
      </section>

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

      <section className="mt-6 space-y-4 transition-opacity duration-200">
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
