import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';
import SeverityBadge from '../../atoms/severity-badge/severity-badge';
import Badge from '../../atoms/badge/badge';
import IconButton from '../../atoms/icon-button/icon-button';
import ExternalLink from '../../atoms/external-link/external-link';
import Skeleton from '../../atoms/skeleton/skeleton';
import { Typography } from '../../foundations/typography/typography';
import type { Vulnerability } from '../../../utils/types/data';

export interface DetailDrawerProps {
  /** Null closes the drawer. */
  finding: Vulnerability | null;
  onClose: () => void;
  /** Loaded separately from descriptions.json, so it can arrive late. */
  description?: string;
  descriptionLoading?: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Typography size="caption" color="muted" className="uppercase">
        {label}
      </Typography>
      {children}
    </div>
  );
}

/**
 * Right-hand drawer showing one finding in full.
 *
 * A drawer rather than a modal because investigating is comparative — the list
 * stays visible behind it, so you keep your place and can move between rows
 * without the page reloading underneath you.
 *
 * Headless UI's Dialog supplies the focus trap, escape handling, scroll lock and
 * `aria-modal` wiring. Rebuilding those correctly is more work than it looks.
 *
 * The caller is expected to mirror the open finding into a search param so the
 * view is linkable; this component only draws what it is given.
 */
export default function DetailDrawer({
  finding,
  onClose,
  description,
  descriptionLoading = false,
}: DetailDrawerProps) {
  return (
    <Transition show={finding !== null} as={Fragment}>
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

        <div className="fixed inset-y-0 right-0 flex max-w-full">
          <TransitionChild
            as={Fragment}
            enter="transform transition duration-200 ease-out"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition duration-150 ease-in"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <DialogPanel className="panel flex h-full w-screen max-w-lg flex-col overflow-y-auto">
              {finding ? (
                <>
                  <div className="border-line flex items-start justify-between gap-4 border-b px-6 py-5">
                    <div className="flex flex-col gap-2">
                      <DialogTitle>
                        <Typography size="h2" font="mono" as="span">
                          {finding.cve}
                        </Typography>
                      </DialogTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={finding.severity} />
                        <Badge mono>CVSS {finding.cvss.toFixed(1)}</Badge>
                        {finding.hasFix ? <Badge tone="resolved">Fix available</Badge> : null}
                        {finding.kaiStatus ? (
                          <Badge tone="info">
                            {finding.kaiStatus === 'ai-invalid-norisk' ? 'AI cleared' : 'Dismissed'}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <IconButton icon={X} label="Close details" onClick={onClose} />
                  </div>

                  <div className="flex flex-col gap-5 px-6 py-5">
                    <Field label="Description">
                      {descriptionLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="w-full" />
                          <Skeleton className="w-4/5" />
                        </div>
                      ) : (
                        <Typography size="body-sm" color="secondary">
                          {description ?? 'No description recorded for this advisory.'}
                        </Typography>
                      )}
                    </Field>

                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Package">
                        <Typography size="body-sm">{finding.packageName}</Typography>
                      </Field>
                      <Field label="Version">
                        <Typography size="mono-sm" color="secondary">
                          {finding.packageVersion}
                        </Typography>
                      </Field>
                      <Field label="Type">
                        <Badge mono>{finding.packageType || 'unknown'}</Badge>
                      </Field>
                      <Field label="Published">
                        <Typography size="mono-sm" color="secondary">
                          {finding.published || 'Unknown'}
                        </Typography>
                      </Field>
                    </div>

                    <Field label="Fix status">
                      <Typography size="body-sm" color="secondary">
                        {finding.fixStatus || 'No fix information'}
                      </Typography>
                    </Field>

                    {finding.riskFactors.length > 0 ? (
                      <Field label="Risk factors">
                        <div className="flex flex-wrap gap-1.5">
                          {finding.riskFactors.map((factor) => (
                            <Badge key={factor}>{factor}</Badge>
                          ))}
                        </div>
                      </Field>
                    ) : null}

                    <Field label="Where">
                      <Typography size="mono-sm" color="secondary" className="break-all">
                        {finding.image}
                      </Typography>
                      <Typography size="caption" color="muted">
                        {finding.group} / {finding.repo}
                      </Typography>
                    </Field>

                    {finding.link ? (
                      <Field label="Advisory">
                        <ExternalLink href={finding.link} className="break-all">
                          {finding.link}
                        </ExternalLink>
                      </Field>
                    ) : null}
                  </div>
                </>
              ) : null}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
