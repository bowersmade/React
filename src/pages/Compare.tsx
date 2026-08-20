import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@headlessui/react';
import { GitCompare, Plus } from 'lucide-react';

import Badge from '../components/atoms/badge/badge';
import Button from '../components/atoms/button/button';
import Card from '../components/atoms/card/card';
import Chip from '../components/atoms/chip/chip';
import ExternalLink from '../components/atoms/external-link/external-link';
import SeverityBadge from '../components/atoms/severity-badge/severity-badge';
import StateMessage from '../components/molecules/state-message/state-message';
import { Typography } from '../components/foundations/typography/typography';
import { useVulnerabilities } from '../context/vulnerabilitiesContext';
import { useAppDispatch } from '../store/hooks';
import { clearSelection, removeSelected } from '../features/Selection/slice';
import { useSelectedFindings } from '../utils/hooks/useSelectedFindings';
import { fixState } from '../utils/helpers/format';
import { useDescriptions, type DescriptionMap } from '../utils/hooks/useDescriptions';
import { cn } from '../utils/cn';
import type { Vulnerability } from '../utils/types/data';

/**
 * Side-by-side comparison of findings selected on the list page.
 *
 * Four columns fit a normal window, which is why the design shows four — but
 * the selection runs to `MAX_COMPARABLE`, so the layout has to survive ten.
 * Rather than transposing into a different component past some threshold, the
 * columns keep a floor width and the panel scrolls sideways: one layout, one
 * set of code paths, and the fifth finding sits exactly where the fourth does
 * instead of in a table that reads nothing like the screen before it.
 */
const COMFORTABLE_COLUMNS = 4;

/**
 * Floor width for a finding's column, and the width of the pinned attribute
 * column. Below roughly this, an image path or a "fixed in 6.1.6, 6.0.19"
 * string wraps into an unreadable ribbon.
 */
const MIN_COLUMN_WIDTH = 240;
const LABEL_COLUMN_WIDTH = 200;

/**
 * One row of the comparison.
 *
 * `compare` reduces the field to a string so rows that disagree can be marked
 * and, with the toggle on, filtered to. It is never displayed — keeping it
 * apart from `render` lets a field look like whatever it should (a badge, a
 * link, a row of chips) without losing the ability to say whether two findings
 * agree on it.
 */
interface Attribute {
  label: string;
  compare: (finding: Vulnerability) => string;
  render: (finding: Vulnerability) => React.ReactNode;
}

/**
 * Built per render rather than declared once, because the Description row needs
 * the advisory text and that arrives asynchronously. Memoised by the caller on
 * the same inputs, so the array identity is still stable between renders.
 */
const buildAttributes = (descriptions: DescriptionMap | null, loading: boolean): Attribute[] => [
  {
    label: 'CVE ID',
    compare: (f) => f.cve,
    render: (f) => (
      <Typography size="mono-sm" className="break-all">
        {f.cve}
      </Typography>
    ),
  },
  {
    label: 'Severity',
    compare: (f) => f.severity,
    render: (f) => <SeverityBadge severity={f.severity} />,
  },
  {
    label: 'CVSS Score',
    compare: (f) => f.cvss.toFixed(1),
    render: (f) => (
      <Typography size="mono-sm" color="secondary">
        {f.cvss.toFixed(1)}
      </Typography>
    ),
  },
  {
    label: 'Review Status',
    compare: (f) => f.kaiStatus,
    render: (f) => {
      if (f.kaiStatus === 'ai-invalid-norisk') {
        return (
          <span className="flex flex-wrap items-center gap-2">
            <Typography size="body-sm" as="span" className="text-info font-medium">
              AI Cleared
            </Typography>
            <Badge tone="info">SENTINEL AI</Badge>
          </span>
        );
      }
      if (f.kaiStatus === 'invalid - norisk') {
        return (
          <Typography size="body-sm" as="span" className="text-resolved font-medium">
            Manually Cleared
          </Typography>
        );
      }
      return (
        <Typography size="body-sm" color="secondary">
          Unreviewed
        </Typography>
      );
    },
  },
  {
    label: 'Package & Version',
    compare: (f) => `${f.packageName} ${f.packageVersion}`,
    render: (f) => (
      <Typography size="mono-sm" color="secondary" className="break-all">
        {f.packageName || '—'} {f.packageVersion}
      </Typography>
    ),
  },
  {
    label: 'Package Type',
    compare: (f) => f.packageType,
    render: (f) => (
      <Typography size="body-sm" color="secondary">
        {f.packageType || 'unknown'}
      </Typography>
    ),
  },
  {
    label: 'Published Date',
    compare: (f) => f.published,
    render: (f) => (
      <Typography size="body-sm" color="secondary">
        {f.published || 'Unknown'}
      </Typography>
    ),
  },
  {
    label: 'Fix Status',
    compare: (f) => f.fixStatus,
    render: (f) => {
      const available = fixState(f.fixStatus) !== 'none';
      return (
        <Typography
          size="body-sm"
          as="span"
          className={cn('font-medium', available ? 'text-resolved' : 'text-secondary')}
        >
          {/* The raw scanner string already carries the versions — "fixed in
              6.1.6, 6.0.19" — so it is shown rather than summarised away. */}
          {f.fixStatus ? capitalise(f.fixStatus) : 'No fix available'}
        </Typography>
      );
    },
  },
  {
    label: 'Risk Factors',
    // Sorted, so two findings carrying the same factors in a different order
    // still count as agreeing.
    compare: (f) => [...f.riskFactors].sort().join(', '),
    render: (f) =>
      f.riskFactors.length ? (
        <div className="flex flex-wrap gap-1.5">
          {f.riskFactors.map((factor) => (
            <Badge key={factor}>{factor}</Badge>
          ))}
        </div>
      ) : (
        <Typography size="body-sm" color="muted">
          None recorded
        </Typography>
      ),
  },
  {
    /**
     * Not in the design, but load-bearing for this dataset: one CVE appears in
     * many images, and cve + image alone collides on 43,089 rows. Without the
     * location two genuinely different findings can render as identical.
     */
    label: 'Location',
    compare: (f) => f.image,
    render: (f) => (
      <div className="flex flex-col gap-1">
        <Typography size="mono-sm" color="secondary" className="break-all">
          {f.image || '—'}
        </Typography>
        <Typography size="caption" color="muted">
          {f.group} / {f.repo}
        </Typography>
      </div>
    ),
  },
  {
    /**
     * The one field that is not in the findings payload — it is keyed by CVE in
     * a separate file, so it can still be arriving after everything else has
     * rendered. `compare` reads the same text that is displayed, so two
     * findings sharing a CVE correctly count as agreeing.
     */
    label: 'Description',
    compare: (f) => descriptions?.[f.cve] ?? '',
    render: (f) => {
      const text = descriptions?.[f.cve];
      if (text) {
        return (
          <Typography size="body-sm" color="secondary">
            {text}
          </Typography>
        );
      }
      return (
        <Typography size="body-sm" color="muted">
          {loading ? 'Loading…' : 'No description recorded for this advisory.'}
        </Typography>
      );
    },
  },
  {
    label: 'Reference',
    compare: (f) => f.link,
    render: (f) =>
      f.link ? (
        <ExternalLink href={f.link}>{sourceName(f.link)}</ExternalLink>
      ) : (
        <Typography size="body-sm" color="muted">
          —
        </Typography>
      ),
  },
];

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** Advisories point at a mix of trackers, so the link is labelled by its host. */
function sourceName(link: string): string {
  try {
    const host = new URL(link).hostname.replace(/^www\./, '');
    if (host.endsWith('nist.gov')) return 'NVD';
    if (host.endsWith('mitre.org')) return 'MITRE';
    return host;
  } catch {
    return 'Advisory';
  }
}

export default function Compare() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [differencesOnly, setDifferencesOnly] = useState(false);

  // Always needed here — Description is one of the compared rows.
  const { descriptions, isLoading: descriptionsLoading } = useDescriptions(true);

  // Only for the loading gate — the findings themselves come from the hook.
  const { isLoading } = useVulnerabilities();
  const findings = useSelectedFindings();

  const rows = useMemo(
    () =>
      buildAttributes(descriptions, descriptionsLoading).map((attribute) => ({
        attribute,
        // One distinct value means every finding agrees; more is the thing the
        // user came here to see.
        differs: new Set(findings.map(attribute.compare)).size > 1,
      })),
    [findings, descriptions, descriptionsLoading]
  );

  const shownRows = differencesOnly ? rows.filter((row) => row.differs) : rows;

  const goToList = () => navigate('/vulnerabilities');

  if (isLoading) {
    return (
      <Card className="mx-auto max-w-xl">
        <StateMessage icon={GitCompare} title="Loading findings" description="One moment." />
      </Card>
    );
  }

  if (findings.length === 0) {
    return (
      <Card className="mx-auto max-w-xl">
        <StateMessage
          icon={GitCompare}
          title="Nothing selected to compare"
          description="Tick findings on the vulnerability list, then choose Compare Selected."
          actionLabel="Back to findings"
          onAction={goToList}
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/*
        Mirrors the list page's filter bar — what is in play, each item
        removable on its own, the way out on the right — including the sideways
        scroll. The chips must not wrap: this is a pill, and a pill that grows a
        second row stops looking like one.
      */}
      <div className="glass rounded-pill flex items-center gap-2 px-4 py-2">
        <Typography size="caption" color="muted" as="span" className="shrink-0 uppercase">
          Comparing:
        </Typography>

        <div className="scrollbar-none fade-edge-right flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {findings.map((finding) => (
            <Chip
              key={finding.id}
              value={finding.cve}
              mono
              onRemove={() => dispatch(removeSelected([finding.id]))}
              className="shrink-0"
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => dispatch(clearSelection())}>
            Clear
          </Button>
          <Button size="sm" variant="ghost" onClick={goToList}>
            Back to List
          </Button>
          <Button size="sm" icon={Plus} onClick={goToList}>
            Add Finding
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-line flex flex-wrap items-center gap-4 border-b px-6 py-5">
          <div className="flex flex-col gap-0.5">
            <Typography size="h3">Vulnerability Parameter Comparison</Typography>
            <Typography size="body-sm" color="muted">
              {findings.length > COMFORTABLE_COLUMNS
                ? `Comparing ${findings.length} findings — scroll sideways for the rest`
                : 'Side-by-side analysis of package, exploit vectors, and patch status'}
            </Typography>
          </div>

          <Switch.Group>
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <Switch.Label>
                <Typography size="body-sm" color="secondary" as="span">
                  Show differences only
                </Typography>
              </Switch.Label>
              <Switch
                checked={differencesOnly}
                onChange={setDifferencesOnly}
                className={cn(
                  'focus-visible:ring-accent focus-visible:ring-offset-page relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  differencesOnly ? 'bg-accent' : 'bg-tint/[0.14]'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none mt-0.5 ml-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-150',
                    differencesOnly ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </Switch>
            </div>
          </Switch.Group>
        </div>

        {shownRows.length > 0 ? <ColumnComparison findings={findings} rows={shownRows} /> : null}

        {shownRows.length === 0 ? (
          <div className="px-6 py-10">
            <StateMessage
              icon={GitCompare}
              title="These findings are identical"
              description="Every compared field matches. Turn off “Show differences only” to see them."
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

interface ComparisonRow {
  attribute: Attribute;
  differs: boolean;
}

/**
 * Attribute labels down the left, one column per finding, scrolling sideways
 * once the findings outrun the window.
 *
 * A grid rather than a card per finding: separate cards cannot keep their rows
 * aligned once one of them wraps, and comparison is exactly the case where
 * misaligned rows make the screen useless.
 *
 * Every row is its own grid so it can carry its own background and border, and
 * they stay in lockstep because they share one column template. The wrapper's
 * explicit `minWidth` is what makes the scroll work: without it each row would
 * only be as wide as the viewport and the backgrounds would stop dead at the
 * fold while the content kept going.
 */
function ColumnComparison({
  findings,
  rows,
}: {
  findings: Vulnerability[];
  rows: ComparisonRow[];
}) {
  const template = `${LABEL_COLUMN_WIDTH}px repeat(${findings.length}, minmax(${MIN_COLUMN_WIDTH}px, 1fr))`;
  const minWidth = LABEL_COLUMN_WIDTH + findings.length * MIN_COLUMN_WIDTH;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth }}>
        {/*
          Deliberately no `items-*` on any of these grids, so every cell
          stretches to the full row height. That matters for the pinned column
          specifically: a shrink-wrapped cell paints its opaque fill only as
          tall as its own one-line label, and on a taller row — Location wraps
          to two — the scrolling columns show through underneath it.
        */}
        <div
          className="surface-header border-line grid border-b"
          style={{ gridTemplateColumns: template }}
        >
          {/*
            Pinned, so the row you are reading stays labelled once the columns
            scroll past it. Sticky needs an opaque fill or the columns slide
            visibly underneath — see `.surface-sticky`.
          */}
          <div className="surface-sticky border-line sticky left-0 z-20 border-r py-3 pr-4 pl-6">
            <Typography size="caption" color="muted" as="span" className="uppercase">
              Attribute
            </Typography>
          </div>
          {findings.map((finding, index) => (
            <div key={finding.id} className="px-3 py-3 last:pr-6">
              <Typography size="caption" color="muted" as="span" className="uppercase">
                Finding {String(index + 1).padStart(2, '0')}
              </Typography>
            </div>
          ))}
        </div>

        {rows.map(({ attribute, differs }) => (
          <div
            key={attribute.label}
            className={cn('border-line grid border-b last:border-b-0', differs && 'bg-tint/[0.03]')}
            style={{ gridTemplateColumns: template }}
          >
            <div
              className={cn(
                'border-line sticky left-0 z-10 border-r py-3.5 pr-4 pl-6',
                // Matches the row tint it sits in, so the pinned column does not
                // read as a stripe of a different colour as it scrolls.
                differs ? 'surface-sticky-differs' : 'surface-sticky'
              )}
            >
              <div className="flex items-center gap-2.5">
                {/* The accent bar marks a row whose values disagree; a muted one
                    keeps the labels optically aligned when they agree. */}
                <span
                  className={cn(
                    'h-3.5 w-0.5 shrink-0 rounded-full',
                    differs ? 'bg-accent' : 'bg-tint/15'
                  )}
                  aria-hidden="true"
                />
                <Typography size="body-sm" as="span" className="font-medium">
                  {attribute.label}
                </Typography>
                {differs ? <span className="sr-only">(values differ)</span> : null}
              </div>
            </div>

            {findings.map((finding) => (
              <div key={finding.id} className="px-3 py-3.5 last:pr-6">
                {attribute.render(finding)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
