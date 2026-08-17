import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  Search,
  X,
  ExternalLink,
  ShieldAlert,
  Database,
} from 'lucide-react';

import { Typography } from '../components/foundations/typography/typography';
import Card from '../components/atoms/card/card';
import Button from '../components/atoms/button/button';
import SeverityBadge from '../components/atoms/severity-badge/severity-badge';
import FilterToggle from '../components/atoms/filter-toggle/filter-toggle';
import ProgressBar from '../components/atoms/progress-bar/progress-bar';
import Skeleton from '../components/atoms/skeleton/skeleton';
import Spinner from '../components/atoms/spinner/spinner';
import Checkbox from '../components/atoms/checkbox/checkbox';
import IconButton from '../components/atoms/icon-button/icon-button';
import TextInput from '../components/atoms/text-input/text-input';
import Select from '../components/atoms/select/select';
import Chip from '../components/atoms/chip/chip';
import Badge from '../components/atoms/badge/badge';
// Aliased — `ExternalLink` is already taken by the lucide icon imported above.
import ExternalLinkAtom from '../components/atoms/external-link/external-link';
import Kbd from '../components/atoms/kbd/kbd';
import SearchInput from '../components/molecules/search-input/search-input';
import FilterBar, { type AppliedFilter } from '../components/molecules/filter-bar/filter-bar';
import TableToolbar from '../components/molecules/table-toolbar/table-toolbar';
import { type SortDirection } from '../components/molecules/sort-header/sort-header';
import VulnerabilityTable from '../components/organisms/vulnerability-table/vulnerability-table';
import DetailDrawer from '../components/organisms/detail-drawer/detail-drawer';
import FilterModal, {
  type FilterModalValue,
} from '../components/organisms/filter-modal/filter-modal';
import type { SeverityKey, Vulnerability } from '../utils/types/data';
import MetricTile from '../components/molecules/metric-tile/metric-tile';
import ChartLegend from '../components/molecules/chart-legend/chart-legend';
import StateMessage from '../components/molecules/state-message/state-message';
import ScopeSelect from '../components/molecules/scope-select/scope-select';
import SeverityDonut from '../components/organisms/severity-donut/severity-donut';
import TrendChart from '../components/organisms/trend-chart/trend-chart';
import RiskVectors from '../components/organisms/risk-vectors/risk-vectors';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <span className="bg-accent h-6 w-1 rounded-full" aria-hidden="true" />
        <Typography size="h2">{title}</Typography>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <Typography size="body-sm" color="muted" className="mb-2.5">
        {label}
      </Typography>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function Sandbox() {
  const [analysis, setAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [checked, setChecked] = useState(true);
  const [query, setQuery] = useState('openssl');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeRow, setActiveRow] = useState<Vulnerability | null>(null);
  const [sortKey, setSortKey] = useState<string | null>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterValue, setFilterValue] = useState<FilterModalValue>({
    severities: ['critical', 'high'],
    riskFactors: [],
    hasFixOnly: false,
    hideManuallyCleared: false,
    hideAiCleared: true,
  });
  const [demoFilters, setDemoFilters] = useState<AppliedFilter[]>([
    { id: 'severity', label: 'Severity', value: 'Critical, High' },
    { id: 'group', label: 'Group', value: '1389-ci-cd' },
    { id: 'repo', label: 'Repo', value: 'app_uxgwrned-dg', mono: true },
  ]);

  /**
   * 500 rows so the virtualisation is actually visible — with a handful you
   * cannot tell it apart from rendering everything.
   */
  const demoRows = useMemo<Vulnerability[]>(() => {
    const severities: SeverityKey[] = ['critical', 'high', 'medium', 'low'];
    const packages = ['spring-web', 'openssl', 'libxml2', 'glibc', 'log4j-core', 'zlib'];
    const kaiStatuses: Vulnerability['kaiStatus'][] = ['', '', '', 'invalid - norisk', 'ai-invalid-norisk'];

    return Array.from({ length: 500 }, (_, i) => ({
      cve: `CVE-2024-${String(10000 + i).slice(0, 5)}`,
      severity: severities[i % severities.length],
      cvss: Number((3 + (i % 70) / 10).toFixed(1)),
      packageName: packages[i % packages.length],
      packageVersion: `${1 + (i % 6)}.${i % 12}.${i % 20}`,
      packageType: i % 2 ? 'jar' : 'rpm',
      published: `2024-${String((i % 12) + 1).padStart(2, '0')}-15`,
      fixStatus: i % 3 ? `fixed in ${2 + (i % 5)}.0.1` : 'affected',
      hasFix: i % 3 !== 0,
      kaiStatus: kaiStatuses[i % kaiStatuses.length],
      riskFactors: ['Attack vector: network', 'Has fix', 'Attack complexity: low'].slice(0, (i % 3) + 1),
      link: `https://nvd.nist.gov/vuln/detail/CVE-2024-${String(10000 + i).slice(0, 5)}`,
      group: '1389-ci-cd',
      repo: `app_${['uxgwrned-dg', 'crpfcofv', 'bdhuplqb'][i % 3]}`,
      image: `quay.example.priv/1389-ci-cd/app_${['uxgwrned-dg', 'crpfcofv', 'bdhuplqb'][i % 3]}:1.0.${i % 9}`,
    }));
  }, []);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>(['low']);

  const toggleSeries = (id: string) =>
    setHiddenSeries((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const [group, setGroup] = useState<string | null>(null);
  const [repo, setRepo] = useState<string | null>(null);

  // Stand-in for the real meta.json byGroup / byRepo maps.
  const groupOptions = [
    { id: '1389-ci-cd', label: '1389-ci-cd', count: 120498 },
    { id: '1499-ci-cd', label: '1499-ci-cd', count: 31387 },
    { id: '1501-ci-cd', label: '1501-ci-cd', count: 26748 },
    { id: '1510-ci-cd', label: '1510-ci-cd', count: 9882 },
    { id: 'openshift', label: 'openshift', count: 4211 },
    { id: 'base-images', label: 'base-images', count: 3877 },
    { id: 'nginxinc', label: 'nginxinc', count: 1204 },
    { id: 'library', label: 'library', count: 986 },
  ];

  const repoOptions = [
    { id: 'app_uxgwrned-dg', label: 'app_uxgwrned-dg', count: 2992 },
    { id: 'app_crpfcofv', label: 'app_crpfcofv', count: 2202 },
    { id: 'app_bdhuplqb', label: 'app_bdhuplqb', count: 1985 },
    { id: 'app_bnagihqg-dg', label: 'app_bnagihqg-dg', count: 1856 },
    { id: 'app_jxdyheml', label: 'app_jxdyheml', count: 1678 },
    { id: 'allocate-app_yxshneby-calc', label: 'allocate-app_yxshneby-calc', count: 1584 },
    { id: 'app_gonzfixi', label: 'app_gonzfixi', count: 789 },
  ];

  // Real figures from public/data/meta.json.
  const severityCounts = { critical: 1773, high: 45841, medium: 127993, low: 61049 };

  const trendData = [
    { month: '2023-12', critical: 1, high: 53, medium: 4013, low: 767 },
    { month: '2024-01', critical: 2, high: 1421, medium: 906, low: 824 },
    { month: '2024-02', critical: 0, high: 369, medium: 2600, low: 832 },
    { month: '2024-03', critical: 0, high: 2973, medium: 1612, low: 976 },
    { month: '2024-04', critical: 1, high: 1197, medium: 1700, low: 475 },
    { month: '2024-05', critical: 1, high: 469, medium: 2148, low: 1409 },
    { month: '2024-06', critical: 20, high: 11, medium: 883, low: 1933 },
    { month: '2024-07', critical: 2, high: 2020, medium: 1012, low: 841 },
    { month: '2024-08', critical: 11, high: 228, medium: 1602, low: 1374 },
    { month: '2024-09', critical: 0, high: 810, medium: 1192, low: 1420 },
    { month: '2024-10', critical: 18, high: 142, medium: 4772, low: 702 },
    { month: '2024-11', critical: 0, high: 338, medium: 1663, low: 134 },
    { month: '2024-12', critical: 2, high: 839, medium: 1595, low: 570 },
  ];

  const riskFactors = [
    { label: 'Has fix', count: 193926 },
    { label: 'Attack vector: network', count: 175691 },
    { label: 'Attack complexity: low', count: 144929 },
    { label: 'Medium severity', count: 127993 },
    { label: 'DoS - High', count: 99666 },
    { label: 'High severity', count: 45841 },
    { label: 'DoS - Low', count: 45071 },
  ];

  const severityLegend = [
    { id: 'critical', label: 'Critical', color: 'bg-critical', count: 1773, percent: 0.7 },
    { id: 'high', label: 'High', color: 'bg-high', count: 45841, percent: 19.4 },
    { id: 'medium', label: 'Medium', color: 'bg-medium', count: 127993, percent: 54.1 },
    { id: 'low', label: 'Low', color: 'bg-low', count: 61049, percent: 25.8 },
  ];

  return (
    <div className="bg-page relative min-h-screen">
      {/*
        Ambient colour clouds — the glass plates read against these, not flat navy.
        Kept in their own clipping layer so the content layer never has
        `overflow-hidden`, which would cut off open dropdowns.
      */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="glow bg-accent/25 top-[4%] left-[8%] h-[500px] w-[500px]" />
        <div className="glow bg-teal/15 top-[28%] right-[5%] h-[600px] w-[600px]" />
        <div className="glow bg-info/25 top-[62%] left-[2%] h-[450px] w-[450px]" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-12 px-8 py-14">
        <header>
          <Typography size="caption" color="accent" className="uppercase">
            Sentinel Design System
          </Typography>
          <Typography size="h1" className="mt-2">
            Component Sandbox
          </Typography>
          <Typography size="body" color="secondary" className="mt-2">
            Every atom in every state, rendered against the real app surface.
          </Typography>
        </header>

        <Section title="Typography">
          <Card className="space-y-3 p-7">
            <Typography size="display">214,832</Typography>
            <Typography size="h1">Vulnerability Overview</Typography>
            <Typography size="h2">Severity Distribution</Typography>
            <Typography size="h3">Risk Factors</Typography>
            <Typography size="body" color="secondary">
              Buffer overflow vulnerability in OpenSSL cryptography libraries allows remote
              attackers to execute arbitrary code.
            </Typography>
            <Typography size="body-sm" color="muted">
              2 days ago · Fix Available
            </Typography>
            <Typography size="mono" color="accent">
              CVE-2024-47176
            </Typography>
            <Typography size="caption" color="muted" className="uppercase">
              Severity · Package · Status
            </Typography>
          </Card>
        </Section>

        <Section title="Colour">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {[
              ['critical', 'bg-critical'],
              ['high', 'bg-high'],
              ['medium', 'bg-medium'],
              ['low', 'bg-low'],
              ['info', 'bg-info'],
              ['resolved', 'bg-resolved'],
              ['accent', 'bg-accent'],
              ['teal', 'bg-teal'],
            ].map(([name, bg]) => (
              <div key={name}>
                <div className={`h-16 rounded-lg ${bg}`} />
                <Typography size="caption" color="muted" className="mt-2">
                  {name}
                </Typography>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Button">
          <Row label="Variants">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="ghost">Ghost Action</Button>
            <Button variant="danger">Danger Action</Button>
          </Row>
          <Row label="With icons">
            <Button variant="primary" icon={Sparkles}>
              AI Analysis
            </Button>
            <Button variant="secondary" icon={Download}>
              Export CSV
            </Button>
            <Button variant="ghost" trailingIcon={ExternalLink}>
              View advisory
            </Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm" icon={Search}>
              Small
            </Button>
            <Button size="md" icon={Search}>
              Medium
            </Button>
            {/* Icon-only controls are IconButton — see its own row below. */}
            <IconButton size="sm" icon={X} label="Dismiss" />
            <IconButton size="md" icon={X} label="Dismiss" />
          </Row>
          <Row label="Disabled">
            <Button variant="primary" disabled>
              Primary
            </Button>
            <Button variant="secondary" disabled>
              Secondary
            </Button>
          </Row>
        </Section>

        <Section title="Severity Badge">
          <Row label="All severities">
            <SeverityBadge severity="critical" />
            <SeverityBadge severity="high" />
            <SeverityBadge severity="medium" />
            <SeverityBadge severity="low" />
          </Row>
          <Row label="Without dot">
            <SeverityBadge severity="critical" showDot={false} />
            <SeverityBadge severity="high" showDot={false} />
            <SeverityBadge severity="medium" showDot={false} />
            <SeverityBadge severity="low" showDot={false} />
          </Row>
        </Section>

        <Section title="Filter Toggle">
          <Row label="Interactive — click to toggle">
            <FilterToggle
              label="Analysis"
              icon={BarChart3}
              active={analysis}
              hiddenCount={17046}
              onToggle={() => setAnalysis((v) => !v)}
            />
            <FilterToggle
              label="AI Analysis"
              icon={Sparkles}
              active={aiAnalysis}
              hiddenCount={11959}
              onToggle={() => setAiAnalysis((v) => !v)}
            />
          </Row>
          <Row label="Both states, side by side">
            <FilterToggle label="Analysis" icon={BarChart3} active={false} hiddenCount={17046} />
            <FilterToggle label="Analysis" icon={BarChart3} active hiddenCount={17046} />
          </Row>
        </Section>

        <Section title="Card">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                [1, 'Level 1 · Subtle', 'White 8% · blur 24px · 1px border'],
                [2, 'Level 2 · Elevated', 'White 14% · blur 24px · drop shadow'],
                [3, 'Level 3 · Modal', 'White 10% · blur 40px · heavy shadow'],
              ] as const
            ).map(([elevation, title, spec]) => (
              <Card key={elevation} elevation={elevation} className="p-6">
                <Typography size="h3">{title}</Typography>
                <Typography size="body-sm" color="muted" className="mt-2">
                  {spec}
                </Typography>
              </Card>
            ))}
          </div>

          <Typography size="body-sm" color="muted" className="mt-6 mb-2.5">
            Interactive — hover and tab to it
          </Typography>
          <Card as="button" interactive className="w-full max-w-xs p-6" onClick={() => {}}>
            <Typography size="caption" color="muted" className="uppercase">
              Critical Vulnerabilities
            </Typography>
            <Typography size="display" color="critical" className="mt-2">
              1,773
            </Typography>
          </Card>
        </Section>

        <Section title="Progress Bar">
          <Card className="max-w-lg space-y-4 p-6">
            {(
              [
                ['Attack vector: network', 76, 'accent'],
                ['Attack complexity: low', 63, 'high'],
                ['Has fix available', 82, 'resolved'],
                ['Physical access', 8, 'muted'],
              ] as const
            ).map(([label, value, tone]) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between">
                  <Typography size="body-sm" color="secondary">
                    {label}
                  </Typography>
                  <Typography size="mono-sm" color="muted">
                    {value}%
                  </Typography>
                </div>
                <ProgressBar value={value} tone={tone} label={`${label}: ${value}%`} />
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Loading">
          <Row label="Spinner sizes">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Button variant="secondary" disabled>
              <Spinner size="sm" label="" />
              Loading findings…
            </Button>
          </Row>
          <Typography size="body-sm" color="muted" className="mt-5 mb-2.5">
            Skeletons
          </Typography>
          <Card className="max-w-xs space-y-3 p-6">
            <Skeleton className="w-32" />
            <Skeleton shape="block" className="h-10 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton shape="circle" className="h-8 w-8" />
              <Skeleton className="w-20" />
            </div>
          </Card>
        </Section>

        <Section title="Checkbox">
          <Row label="States">
            <Checkbox label="Unreviewed" checked={checked} onChange={() => setChecked((v) => !v)} />
            <Checkbox label="Manually cleared" checked={false} onChange={() => {}} />
            <Checkbox label="Partially selected" indeterminate onChange={() => {}} />
            <Checkbox label="Disabled" disabled onChange={() => {}} />
          </Row>
          <Row label="Bare — for table rows">
            <Checkbox aria-label="Select row" checked onChange={() => {}} />
            <Checkbox aria-label="Select row" checked={false} onChange={() => {}} />
          </Row>
        </Section>

        <Section title="Icon Button">
          <Row label="Tones">
            <IconButton icon={X} label="Dismiss" />
            <IconButton icon={Download} label="Export" tone="glass" />
            <IconButton icon={ArrowUpDown} label="Sort" active />
            <IconButton icon={X} label="Dismiss" disabled />
          </Row>
          <Row label="Sizes">
            <IconButton size="sm" icon={ChevronLeft} label="Previous page" />
            <IconButton size="md" icon={ChevronRight} label="Next page" />
          </Row>
        </Section>

        <Section title="Text Input">
          <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              label="Search"
              icon={Search}
              placeholder="CVE, package, or image…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery('')}
            />
            <TextInput label="Package name" placeholder="spring-web" hint="Exact match only" />
            <TextInput label="CVSS minimum" defaultValue="banana" error="Must be a number" />
            <TextInput label="Disabled" placeholder="Unavailable" disabled />
            <TextInput size="sm" label="Small" icon={Search} placeholder="Compact row" />
          </div>
        </Section>

        <Section title="Select">
          <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Sort by"
              options={[
                { value: 'severity', label: 'Severity (high to low)' },
                { value: 'cvss', label: 'CVSS score' },
                { value: 'published', label: 'Date published' },
                { value: 'package', label: 'Package name' },
              ]}
            />
            <Select
              size="sm"
              label="Rows per page"
              options={[
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
              ]}
            />
          </div>
        </Section>

        <Section title="Chip">
          <Row label="Applied filters">
            <Chip label="Severity" value="Critical" onRemove={() => {}} />
            <Chip label="Group" value="1389-ci-cd" onRemove={() => {}} />
            <Chip label="Repo" value="app_uxgwrned-dg" mono onRemove={() => {}} />
            <Chip label="Risk" value="Exploit exists - in the wild" icon={Sparkles} onRemove={() => {}} />
          </Row>
          <Row label="Read-only — no remove button">
            <Chip value="Has fix" />
            <Chip label="Published" value="After 2024-01" />
          </Row>
        </Section>

        <Section title="Badge">
          <Row label="Tones">
            <Badge>Unreviewed</Badge>
            <Badge tone="info">AI cleared</Badge>
            <Badge tone="resolved">Fix available</Badge>
            <Badge tone="accent">New</Badge>
          </Row>
          <Row label="Monospace — package types and versions">
            <Badge mono>jar</Badge>
            <Badge mono>npm</Badge>
            <Badge mono tone="info">5.1.8.RELEASE</Badge>
          </Row>
        </Section>

        <Section title="External Link">
          <Row label="Advisory links">
            <ExternalLinkAtom href="https://nvd.nist.gov/vuln/detail/CVE-2024-22262">
              CVE-2024-22262
            </ExternalLinkAtom>
            <ExternalLinkAtom href="https://issues.redhat.com/browse/UNDERTOW-1935" hideIcon>
              Vendor tracker (no icon)
            </ExternalLinkAtom>
          </Row>
        </Section>

        <Section title="Kbd">
          <Row label="Shortcut hints">
            <Kbd>⌘K</Kbd>
            <Kbd>Esc</Kbd>
            <Kbd>⇧ + Click</Kbd>
          </Row>
        </Section>

        <Section title="Metric Tile">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="Total Vulnerabilities"
              value="236,656"
              detail="1,030 images scanned"
              icon={ShieldAlert}
              onClick={() => {}}
            />
            <MetricTile
              label="Critical"
              value="1,773"
              detail="0.7% of total"
              tone="critical"
              progress={0.7}
              onClick={() => {}}
            />
            <MetricTile
              label="High Severity"
              value="45,841"
              detail="19.4% of total"
              tone="high"
              progress={19.4}
              onClick={() => {}}
            />
            <MetricTile
              label="Cleared by Review"
              value="12.3%"
              detail="29,005 of 236,656 dismissed"
              icon={Database}
              tone="info"
              progress={12.3}
            />
          </div>

          <Typography size="body-sm" color="muted" className="mt-5 mb-2.5">
            Loading
          </Typography>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="" value="" loading />
            <MetricTile label="" value="" loading />
          </div>
        </Section>

        <Section title="Scope Select">
          <Card className="p-6">
            <Typography size="body-sm" color="muted" className="mb-4">
              Click or type to filter · arrow keys to navigate · Enter to select · Esc to close
            </Typography>
            <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              <ScopeSelect
                label="Group"
                options={groupOptions}
                value={group}
                onChange={setGroup}
                allLabel="All Groups (45)"
                searchPlaceholder="Search 45 groups…"
              />
              <ScopeSelect
                label="Repository"
                options={repoOptions}
                value={repo}
                onChange={setRepo}
                allLabel="All Repositories (727)"
                searchPlaceholder="Search 727 repositories…"
                mono
              />
            </div>
            <Typography size="body-sm" color="muted" className="mt-4">
              Selected scope: {group ?? 'all groups'} / {repo ?? 'all repositories'}
            </Typography>
          </Card>
        </Section>

        <Section title="Chart Legend">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <Typography size="body-sm" color="muted" className="mb-4">
                Column — click to toggle a series
              </Typography>
              <ChartLegend
                items={severityLegend}
                hidden={hiddenSeries}
                onToggle={toggleSeries}
                direction="column"
              />
            </Card>
            <Card className="p-6">
              <Typography size="body-sm" color="muted" className="mb-4">
                Row — static
              </Typography>
              <ChartLegend items={severityLegend} direction="row" />
            </Card>
          </div>
        </Section>

        <Section title="Charts">
          <div className="space-y-4">
            <TrendChart data={trendData} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SeverityDonut counts={severityCounts} />
              <RiskVectors factors={riskFactors} total={236656} />
            </div>

            <Typography size="body-sm" color="muted" className="mt-6 mb-2.5">
              Loading, empty and sparse states
            </Typography>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SeverityDonut counts={severityCounts} loading />
              <SeverityDonut counts={{ critical: 0, high: 0, medium: 0, low: 0 }} />
              <RiskVectors factors={[]} total={0} />
              <TrendChart data={trendData.slice(0, 2)} />
            </div>
          </div>
        </Section>

        <Section title="Empty & Error States">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-2">
              <StateMessage
                title="No findings match these filters"
                description="Try widening the severity range or clearing the review-status filter."
                actionLabel="Clear filters"
                onAction={() => {}}
              />
            </Card>
            <Card className="p-2">
              <StateMessage
                variant="error"
                title="Couldn't load vulnerabilities"
                description="The dataset failed to fetch. Check your connection and try again."
                actionLabel="Retry"
                onAction={() => {}}
              />
            </Card>
          </div>
        </Section>

        <Section title="Search Input">
          <div className="max-w-xl">
            <SearchInput
              value={query}
              onChange={setQuery}
              suggestions={
                query.trim()
                  ? [
                      { id: 'a', label: 'CVE-2024-22262', kind: 'CVE', count: 412 },
                      { id: 'b', label: 'openssl', kind: 'Package', count: 3891 },
                      { id: 'c', label: 'openssl-libs', kind: 'Package', count: 1204 },
                      { id: 'd', label: 'quay.example.priv/base-images/openssl:3.1', kind: 'Image', count: 88 },
                    ]
                  : []
              }
            />
            <Typography size="caption" color="muted" className="mt-2">
              Type to see suggestions. Matching is the caller's job — these are hardcoded.
            </Typography>
          </div>
        </Section>

        <Section title="Filter Bar">
          <FilterBar
            filters={demoFilters}
            onRemove={(id) => setDemoFilters((prev) => prev.filter((f) => f.id !== id))}
            onClear={() => setDemoFilters([])}
            onAddFilter={() => setFilterModalOpen(true)}
          />
        </Section>

        <Section title="Table Toolbar">
          <Row label="Nothing selected">
            <TableToolbar
              selectedCount={0}
              onClearSelection={() => {}}
              onExport={() => {}}
              onViewTrend={() => {}}
              className="w-full"
            />
          </Row>
          <Row label="Rows selected">
            <TableToolbar
              selectedCount={selectedIds.size}
              onClearSelection={() => setSelectedIds(new Set())}
              onCompare={() => {}}
              className="w-full"
            />
          </Row>
        </Section>

        <Section title="Vulnerability Table">
          <Card className="overflow-hidden rounded-lg p-0">
            <VulnerabilityTable
              rows={demoRows}
              selectedIds={selectedIds}
              activeId={activeRow ? `${activeRow.cve}::${activeRow.image}` : null}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={(key) => {
                if (key === sortKey) {
                  setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortKey(key);
                  setSortDirection('desc');
                }
              }}
              onToggleRow={(id) =>
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
              onToggleAll={() =>
                setSelectedIds((prev) =>
                  prev.size === demoRows.length
                    ? new Set()
                    : new Set(demoRows.map((r) => `${r.cve}::${r.image}`))
                )
              }
              onRowClick={setActiveRow}
              height={420}
            />
          </Card>
          <Typography size="caption" color="muted" className="mt-2">
            500 rows, virtualised — inspect the DOM and only the visible ones exist. Click a row to
            open the drawer.
          </Typography>
        </Section>

        <Section title="Detail Drawer & Filter Modal">
          <Row label="Open them">
            <Button onClick={() => setActiveRow(demoRows[0])}>Open detail drawer</Button>
            <Button onClick={() => setFilterModalOpen(true)}>Open filter modal</Button>
          </Row>
        </Section>
      </div>

      <DetailDrawer
        finding={activeRow}
        onClose={() => setActiveRow(null)}
        description="Spring Framework provides support for range requests. A specially crafted HTTP request may cause a denial of service condition in applications that serve static resources."
      />

      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        value={filterValue}
        onChange={setFilterValue}
        onApply={() => setFilterModalOpen(false)}
        onReset={() =>
          setFilterValue({
            severities: [],
            riskFactors: [],
            hasFixOnly: false,
            hideManuallyCleared: false,
            hideAiCleared: false,
          })
        }
        riskFactorOptions={riskFactors.slice(0, 5)}
        previewCount={12483}
      />
    </div>
  );
}
