import { useState } from 'react';
import { BarChart3, Sparkles, Download, Search, X, ExternalLink } from 'lucide-react';

import { Typography } from '../../components/foundations/typography/typography';
import Card from '../../components/atoms/card/card';
import Button from '../../components/atoms/button/button';
import SeverityBadge from '../../components/atoms/severity-badge/severity-badge';
import FilterToggle from '../../components/atoms/filter-toggle/filter-toggle';
import ProgressBar from '../../components/atoms/progress-bar/progress-bar';
import Skeleton from '../../components/atoms/skeleton/skeleton';
import Spinner from '../../components/atoms/spinner/spinner';

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

  return (
    <div className="bg-page relative min-h-screen overflow-hidden">
      {/* Ambient colour clouds — the glass plates read against these, not flat black. */}
      <div
        className="glow bg-accent/25 left-[8%] top-[4%] h-[500px] w-[500px]"
        aria-hidden="true"
      />
      <div
        className="glow bg-teal/15 right-[5%] top-[28%] h-[600px] w-[600px]"
        aria-hidden="true"
      />
      <div className="glow bg-info/25 left-[2%] top-[62%] h-[450px] w-[450px]" aria-hidden="true" />

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
      </div>
    </div>
  );
}
