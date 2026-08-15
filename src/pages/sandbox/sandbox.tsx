import { useState } from 'react';
import {
  BarChart3,
  Sparkles,
  Download,
  Search,
  X,
  ExternalLink,
  ShieldAlert,
  Database,
} from 'lucide-react';

import { Typography } from '../../components/foundations/typography/typography';
import Card from '../../components/atoms/card/card';
import Button from '../../components/atoms/button/button';
import SeverityBadge from '../../components/atoms/severity-badge/severity-badge';
import FilterToggle from '../../components/atoms/filter-toggle/filter-toggle';
import ProgressBar from '../../components/atoms/progress-bar/progress-bar';
import Skeleton from '../../components/atoms/skeleton/skeleton';
import Spinner from '../../components/atoms/spinner/spinner';
import Checkbox from '../../components/atoms/checkbox/checkbox';
import MetricTile from '../../components/molecules/metric-tile/metric-tile';
import ChartLegend from '../../components/molecules/chart-legend/chart-legend';
import StateMessage from '../../components/molecules/state-message/state-message';
import ScopeSelect from '../../components/molecules/scope-select/scope-select';

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
          <Row label="Sizes and icon-only">
            <Button size="sm" icon={Search}>
              Small
            </Button>
            <Button size="md" icon={Search}>
              Medium
            </Button>
            <Button size="sm" iconOnly icon={X} aria-label="Dismiss" />
            <Button size="md" iconOnly icon={X} aria-label="Dismiss" />
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
      </div>
    </div>
  );
}
