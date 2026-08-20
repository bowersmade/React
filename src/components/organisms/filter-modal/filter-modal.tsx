import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { SlidersHorizontal, X } from 'lucide-react';
import Checkbox from '../../atoms/checkbox/checkbox';
import Button from '../../atoms/button/button';
import IconButton from '../../atoms/icon-button/icon-button';
import { Typography } from '../../foundations/typography/typography';
import { cn } from '../../../utils/cn';
import { severityOrder, type SeverityKey } from '../../../utils/types/data';

/**
 * Mirrors the filter half of `Filters` exactly, so the page can hand this
 * straight to `filterData` without translating anything.
 *
 * Review status is stored as "hide" flags rather than "show" flags because that
 * is the shape the URL and the dashboard's two buttons already use. The modal
 * presents them the other way up — see ReviewRow — since a user ticks what they
 * want to see, not what they want gone.
 */
export interface FilterModalValue {
  severities: SeverityKey[];
  hideUnreviewed: boolean;
  hideManuallyCleared: boolean;
  hideAiCleared: boolean;
  /** 'YYYY-MM-DD', or null for no bound. */
  from: string | null;
  to: string | null;
}

export interface ReviewCounts {
  unreviewed: number;
  manuallyCleared: number;
  aiCleared: number;
}

export interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  value: FilterModalValue;
  onChange: (next: FilterModalValue) => void;
  onApply: () => void;
  onReset: () => void;
  /** Counts for the current scope, before this modal's own filters. */
  severityCounts?: Record<SeverityKey, number>;
  reviewCounts?: ReviewCounts;
  /** Bounds of the dataset, so dates with no findings behind them can't be picked. */
  minDate?: string;
  maxDate?: string;
  /** Findings the draft selection would show. Lets you see before committing. */
  previewCount?: number;
  /**
   * Fires when the close animation has finished, ~150ms after `open` goes
   * false. The panel is still on screen for that gap.
   */
  afterLeave?: () => void;
  className?: string;
}

const severityLabels: Record<SeverityKey, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const severityDot: Record<SeverityKey, string> = {
  critical: 'bg-critical',
  high: 'bg-high',
  medium: 'bg-medium',
  low: 'bg-low',
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5">
        <Typography size="caption" color="muted" as="span" className="uppercase">
          {title}
        </Typography>
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/**
 * One filter option as a bordered chip.
 *
 * The whole chip is the label element, so the hit target is the box rather than
 * the 16px checkbox inside it.
 */
function Chip({
  label,
  count,
  checked,
  onToggle,
  dot,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
  dot?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors duration-150',
        checked
          ? 'border-accent bg-accent/10'
          : 'border-line hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.07]'
      )}
    >
      <Checkbox checked={checked} onChange={onToggle} aria-label={label} />
      {dot ? (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} aria-hidden="true" />
      ) : null}
      <Typography size="body-sm" color={checked ? 'primary' : 'secondary'} as="span">
        {label}
      </Typography>
      {count !== undefined ? (
        <Typography size="mono-sm" color="muted" as="span">
          ({count.toLocaleString()})
        </Typography>
      ) : null}
    </label>
  );
}

/** Date bounds are the dataset's own range, so an empty result is unpickable. */
function DateField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string | null;
  onChange: (next: string | null) => void;
  min?: string;
  max?: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <Typography size="caption" color="muted" as="span">
        {label}
      </Typography>
      <input
        type="date"
        value={value ?? ''}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value || null)}
        className="border-line text-body text-primary focus-visible:ring-accent focus-visible:ring-offset-page w-full rounded-md border bg-white/[0.06] px-3 py-2 font-sans transition-colors duration-150 hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none [color-scheme:dark]"
      />
    </label>
  );
}

/**
 * The full filter set, in a modal.
 *
 * Deliberately not live: changes stay local until Apply. Filtering 236k records
 * on every checkbox tick would make the dialog stutter, and more importantly a
 * multi-part filter is usually built up in several steps — applying each one
 * mid-thought shows the user states they never asked for.
 *
 * `previewCount` is the compromise. The caller can compute what the draft
 * selection would return and show it in the footer, so nothing is committed
 * blind.
 *
 * Real `fieldset` and `legend` elements group the options, which is how a
 * screen reader knows "Critical" belongs to Severity rather than floating free.
 */
export default function FilterModal({
  open,
  onClose,
  value,
  onChange,
  onApply,
  onReset,
  severityCounts,
  reviewCounts,
  minDate,
  maxDate,
  previewCount,
  afterLeave,
  className = '',
}: FilterModalProps) {
  const toggleSeverity = (severity: SeverityKey) =>
    onChange({
      ...value,
      severities:
        value.severities.length && value.severities.includes(severity)
          ? value.severities.filter((s) => s !== severity)
          : [...value.severities, severity],
    });

  // Ticked means "show me this", which is the opposite of how it is stored.
  const reviewRows: {
    label: string;
    hidden: boolean;
    count?: number;
    key: keyof FilterModalValue;
  }[] = [
    {
      label: 'Unreviewed',
      hidden: value.hideUnreviewed,
      count: reviewCounts?.unreviewed,
      key: 'hideUnreviewed',
    },
    {
      label: 'Manually Cleared',
      hidden: value.hideManuallyCleared,
      count: reviewCounts?.manuallyCleared,
      key: 'hideManuallyCleared',
    },
    {
      label: 'AI Cleared',
      hidden: value.hideAiCleared,
      count: reviewCounts?.aiCleared,
      key: 'hideAiCleared',
    },
  ];

  /** from cannot be after to, enforced by narrowing each picker's range. */
  const fromMax = value.to ?? maxDate;
  const toMin = value.from ?? minDate;

  return (
    <Transition show={open} as={Fragment} afterLeave={afterLeave}>
      <Dialog onClose={onClose} className={cn('relative z-50', className)}>
        <TransitionChild
          as={Fragment}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="transition duration-200 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition duration-150 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              data-testid="sn-filter-modal"
              className="panel flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl"
            >
              <div className="flex items-center gap-3 px-6 pt-5 pb-4">
                <span className="bg-accent/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <SlidersHorizontal size={17} className="text-accent" aria-hidden="true" />
                </span>
                <DialogTitle>
                  <Typography size="h3" as="span">
                    Add Filters
                  </Typography>
                </DialogTitle>
                <span className="flex-1" />
                <IconButton icon={X} label="Close filters" onClick={onClose} />
              </div>

              <div className="border-line flex flex-col gap-6 overflow-y-auto border-t px-6 py-5">
                <Group title="Severity">
                  {severityOrder.map((severity) => (
                    <Chip
                      key={severity}
                      label={severityLabels[severity]}
                      count={severityCounts?.[severity]}
                      dot={severityDot[severity]}
                      checked={value.severities.includes(severity)}
                      onToggle={() => toggleSeverity(severity)}
                    />
                  ))}
                </Group>

                <Group title="Review status">
                  {reviewRows.map((row) => (
                    <Chip
                      key={row.key}
                      label={row.label}
                      count={row.count}
                      checked={!row.hidden}
                      onToggle={() => onChange({ ...value, [row.key]: !row.hidden })}
                    />
                  ))}
                </Group>

                <fieldset>
                  <legend className="mb-2.5">
                    <Typography size="caption" color="muted" as="span" className="uppercase">
                      Date range
                    </Typography>
                  </legend>
                  <div className="flex items-end gap-3">
                    <DateField
                      label="From"
                      value={value.from}
                      onChange={(next) => onChange({ ...value, from: next })}
                      min={minDate}
                      max={fromMax}
                    />
                    <DateField
                      label="To"
                      value={value.to}
                      onChange={(next) => onChange({ ...value, to: next })}
                      min={toMin}
                      max={maxDate}
                    />
                  </div>
                </fieldset>
              </div>

              <div className="border-line flex items-center gap-3 border-t px-6 py-4">
                {previewCount !== undefined ? (
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        previewCount > 0 ? 'bg-resolved' : 'bg-critical'
                      )}
                      aria-hidden="true"
                    />
                    <Typography size="body-sm" color="secondary" as="span">
                      {previewCount.toLocaleString()} results match
                    </Typography>
                  </span>
                ) : null}

                <span className="flex-1" />

                <Button variant="ghost" onClick={onReset}>
                  Reset
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={onApply}>
                  Apply Filters
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
