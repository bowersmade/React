import { Fragment, useDeferredValue, useMemo, useState } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Box, Package, Search, ShieldAlert } from 'lucide-react';

import SeverityBadge from '../../atoms/severity-badge/severity-badge';
import { Typography } from '../../foundations/typography/typography';
import {
  searchFindings,
  SEARCH_RESULT_LIMIT,
  type SearchResult,
} from '../../../utils/helpers/search';
import { cn } from '../../../utils/cn';
import type { Vulnerability } from '../../../utils/types/data';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Every finding — the palette searches the whole set, not the filtered view. */
  data: Vulnerability[];
  /** Fired with the chosen finding. The caller decides where that goes. */
  onSelect: (finding: Vulnerability) => void;
}

const fieldIcon = {
  cve: ShieldAlert,
  package: Package,
  image: Box,
} as const;

const fieldLabel = {
  cve: 'CVE',
  package: 'Package',
  image: 'Image',
} as const;

/**
 * ⌘K search across every finding.
 *
 * Searches the whole dataset rather than the current filtered view: the point
 * of a palette is to reach something you cannot currently see. Narrowing to the
 * active filters would make it a worse version of the list page.
 *
 * `Combobox` rather than a hand-rolled list. Arrow keys, wraparound, typeahead,
 * `aria-activedescendant`, and the focus contract between an input and a listbox
 * it does not contain are all things Headless UI already gets right, and all
 * things that are quietly broken in most bespoke implementations.
 */
export default function CommandPalette({ open, onClose, data, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  /**
   * The scan is ~30ms at 236k rows — fast enough not to need a timer, slow
   * enough to be felt on every keystroke if it ran synchronously. Deferring
   * lets the typed character paint immediately and the results catch up on the
   * following low-priority render, which is the same trick the filter modal's
   * counts use.
   */
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => searchFindings(data, deferredQuery), [data, deferredQuery]);

  // True while the results on screen belong to an older query than the input.
  const isStale = query !== deferredQuery;

  const handleSelect = (finding: Vulnerability | null) => {
    if (!finding) return;
    onSelect(finding);
    onClose();
  };

  return (
    <Transition show={open} as={Fragment} afterLeave={() => setQuery('')}>
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
          <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        </TransitionChild>

        {/* Sat high rather than centred: the list grows downwards, and a
            vertically centred palette jumps as results arrive. */}
        <div className="fixed inset-0 flex justify-center p-4 pt-[12vh]">
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
              data-testid="sn-command-palette"
              className="panel flex h-fit max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl"
            >
              <Combobox<Vulnerability | null> onChange={handleSelect}>
                <div className="border-line flex items-center gap-3 border-b px-5 py-4">
                  <Search size={18} className="text-muted shrink-0" aria-hidden="true" />
                  <ComboboxInput
                    autoFocus
                    placeholder="Search by CVE, package name, or image…"
                    aria-label="Search findings"
                    className="text-body text-primary placeholder:text-muted w-full bg-transparent font-sans outline-none"
                    onChange={(event) => setQuery(event.target.value)}
                    // The palette closes on select, so there is never a chosen
                    // value to display — without this the input would be
                    // cleared to "[object Object]" on the way out.
                    displayValue={() => query}
                  />
                  <kbd className="border-line text-caption text-muted shrink-0 rounded-sm border px-1.5 py-0.5 font-sans">
                    ESC
                  </kbd>
                </div>

                {query.trim() ? (
                  <ComboboxOptions
                    static
                    className={cn(
                      'flex-1 overflow-y-auto py-2 transition-opacity duration-150',
                      isStale && 'opacity-60'
                    )}
                  >
                    {results.length === 0 && !isStale ? (
                      <div className="px-5 py-8 text-center">
                        <Typography size="body-sm" color="muted">
                          No findings match “{query.trim()}”.
                        </Typography>
                      </div>
                    ) : (
                      results.map((result) => <ResultRow key={result.finding.id} result={result} />)
                    )}

                    {results.length >= SEARCH_RESULT_LIMIT ? (
                      <div className="border-line mt-2 border-t px-5 pt-3 pb-1">
                        <Typography size="caption" color="muted">
                          Showing the first {SEARCH_RESULT_LIMIT} matches — keep typing to narrow,
                          or use the filters on the findings list.
                        </Typography>
                      </div>
                    ) : null}
                  </ComboboxOptions>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <Typography size="body-sm" color="muted">
                      Search {data.length.toLocaleString()} findings by CVE, package name, or image.
                    </Typography>
                  </div>
                )}
              </Combobox>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

function ResultRow({ result }: { result: SearchResult }) {
  const { finding, field } = result;
  const Icon = fieldIcon[field];

  return (
    <ComboboxOption value={finding} as={Fragment}>
      {({ focus }) => (
        <li
          className={cn(
            'flex cursor-pointer items-center gap-3 px-5 py-2.5',
            focus && 'bg-tint/[0.07]'
          )}
        >
          <Icon size={15} className="text-muted shrink-0" aria-hidden="true" />

          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <Typography size="mono-sm" as="span" className="truncate">
                {finding.cve}
              </Typography>
              <SeverityBadge severity={finding.severity} />
            </span>
            <Typography size="caption" color="muted" className="truncate">
              {finding.packageName} {finding.packageVersion} · {finding.image}
            </Typography>
          </span>

          {/* Says which field the hit came from, so a result that looks
              unrelated to the query is explicable rather than baffling. */}
          <Typography size="caption" color="muted" as="span" className="shrink-0 uppercase">
            {fieldLabel[field]}
          </Typography>
        </li>
      )}
    </ComboboxOption>
  );
}
