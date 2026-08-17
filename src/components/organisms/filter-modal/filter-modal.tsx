import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';
import Checkbox from '../../atoms/checkbox/checkbox';
import Button from '../../atoms/button/button';
import IconButton from '../../atoms/icon-button/icon-button';
import { Typography } from '../../foundations/typography/typography';
import { severityOrder, type SeverityKey } from '../../../utils/types/data';

export interface FilterModalValue {
  severities: SeverityKey[];
  riskFactors: string[];
  hasFixOnly: boolean;
  hideManuallyCleared: boolean;
  hideAiCleared: boolean;
}

export interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  value: FilterModalValue;
  onChange: (next: FilterModalValue) => void;
  onApply: () => void;
  onReset: () => void;
  /** Every risk factor label in the data, with counts for the current scope. */
  riskFactorOptions?: { label: string; count: number }[];
  /** Findings the pending selection would show. Lets you see before committing. */
  previewCount?: number;
}

const severityLabels: Record<SeverityKey, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1">
        <Typography size="caption" color="muted" as="span" className="uppercase">
          {title}
        </Typography>
      </legend>
      {children}
    </fieldset>
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
 * `previewCount` is the compromise. The caller can compute what the pending
 * selection would return and show it on the button, so nothing is committed
 * blind.
 *
 * Real `fieldset` and `legend` elements group the checkboxes, which is how a
 * screen reader knows "Critical" belongs to Severity rather than floating free.
 */
export default function FilterModal({
  open,
  onClose,
  value,
  onChange,
  onApply,
  onReset,
  riskFactorOptions = [],
  previewCount,
}: FilterModalProps) {
  const toggleSeverity = (severity: SeverityKey) =>
    onChange({
      ...value,
      severities: value.severities.includes(severity)
        ? value.severities.filter((s) => s !== severity)
        : [...value.severities, severity],
    });

  const toggleRiskFactor = (factor: string) =>
    onChange({
      ...value,
      riskFactors: value.riskFactors.includes(factor)
        ? value.riskFactors.filter((f) => f !== factor)
        : [...value.riskFactors, factor],
    });

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
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
            <DialogPanel className="panel flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl">
              <div className="border-line flex items-center justify-between gap-4 border-b px-6 py-4">
                <DialogTitle>
                  <Typography size="h2" as="span">
                    Filters
                  </Typography>
                </DialogTitle>
                <IconButton icon={X} label="Close filters" onClick={onClose} />
              </div>

              <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
                <Group title="Severity">
                  {severityOrder.map((severity) => (
                    <Checkbox
                      key={severity}
                      label={severityLabels[severity]}
                      checked={value.severities.includes(severity)}
                      onChange={() => toggleSeverity(severity)}
                    />
                  ))}
                </Group>

                <Group title="Review status">
                  <Checkbox
                    label="Hide findings dismissed by a reviewer"
                    checked={value.hideManuallyCleared}
                    onChange={() =>
                      onChange({ ...value, hideManuallyCleared: !value.hideManuallyCleared })
                    }
                  />
                  <Checkbox
                    label="Hide findings dismissed by AI"
                    checked={value.hideAiCleared}
                    onChange={() => onChange({ ...value, hideAiCleared: !value.hideAiCleared })}
                  />
                </Group>

                <Group title="Fix">
                  <Checkbox
                    label="Only findings with a fix available"
                    checked={value.hasFixOnly}
                    onChange={() => onChange({ ...value, hasFixOnly: !value.hasFixOnly })}
                  />
                </Group>

                {riskFactorOptions.length > 0 ? (
                  <Group title="Risk factors">
                    {riskFactorOptions.map((option) => (
                      <span key={option.label} className="flex items-center justify-between gap-3">
                        <Checkbox
                          label={option.label}
                          checked={value.riskFactors.includes(option.label)}
                          onChange={() => toggleRiskFactor(option.label)}
                        />
                        <Typography size="mono-sm" color="muted" className="shrink-0">
                          {option.count.toLocaleString()}
                        </Typography>
                      </span>
                    ))}
                  </Group>
                ) : null}
              </div>

              <div className="border-line flex items-center justify-between gap-3 border-t px-6 py-4">
                <Button variant="ghost" onClick={onReset}>
                  Reset
                </Button>
                <Button variant="primary" onClick={onApply}>
                  {previewCount === undefined
                    ? 'Apply filters'
                    : `Show ${previewCount.toLocaleString()} findings`}
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
