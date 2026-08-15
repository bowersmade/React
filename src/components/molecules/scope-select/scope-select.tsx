import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Typography } from '../../foundations/typography/typography';
import { cn } from '../../../utils/cn';

export interface ScopeOption {
  id: string;
  label: string;
  /** Vulnerability count, shown so relative size is visible before selecting. */
  count?: number;
}

export interface ScopeSelectProps {
  /** Shown above the control, e.g. "Group". */
  label: string;
  options: ScopeOption[];
  /** `null` means the "all" option is selected. */
  value: string | null;
  onChange: (id: string | null) => void;
  /** Label for the reset option, e.g. "All Groups (45)". */
  allLabel: string;
  /** Placeholder for the search field inside the panel. */
  searchPlaceholder?: string;
  /** Rendered in monospace — use for repo and image names. */
  mono?: boolean;
  disabled?: boolean;
  className?: string;
}

const ALL = '__all__';

/**
 * Tracks the trigger's viewport position so the portalled panel can sit
 * directly beneath it. Recalculated on scroll and resize.
 */
function useAnchorRect(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const measure = useCallback(() => {
    if (ref.current) setRect(ref.current.getBoundingClientRect());
  }, [ref]);

  useEffect(() => {
    if (!active) return;
    measure();

    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [active, measure]);

  return rect;
}

export default function ScopeSelect({
  label,
  options,
  value,
  onChange,
  allLabel,
  searchPlaceholder = 'Search…',
  mono = false,
  disabled = false,
  className = '',
}: ScopeSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const rect = useAnchorRect(triggerRef, open);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = value ? options.find((o) => o.id === value) : undefined;

  const optionRow =
    'flex cursor-pointer items-center justify-between gap-3 rounded-sm px-2 py-1.5 data-[focus]:bg-accent/15';

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Typography size="caption" color="muted" className="uppercase">
        {label}
      </Typography>

      <Combobox
        value={value ?? ALL}
        onChange={(next: string | null) => onChange(!next || next === ALL ? null : next)}
        onClose={() => setQuery('')}
        disabled={disabled}
      >
        {({ open: isOpen }) => {
          // Keep local state in sync so the portal mounts/unmounts with the panel.
          if (isOpen !== open) setOpen(isOpen);

          return (
            <div ref={triggerRef} className="relative">
              <ComboboxButton className="border-line focus-visible:ring-accent focus-visible:ring-offset-page flex w-full items-center justify-between gap-2 rounded-md border bg-white/[0.06] px-3 py-2 text-left transition-colors duration-150 hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40">
                <Typography
                  size={mono && selected ? 'mono-sm' : 'body'}
                  color={selected ? 'primary' : 'secondary'}
                  className="truncate"
                >
                  {selected?.label ?? allLabel}
                </Typography>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={cn(
                    'text-muted shrink-0 transition-transform duration-150',
                    isOpen && 'rotate-180'
                  )}
                />
              </ComboboxButton>

              {/*
                Portalled to <body> so the panel escapes every ancestor stacking
                context. Glass cards use backdrop-filter, which creates a
                stacking context — an inline panel would be painted over by any
                later sibling card no matter its z-index.
              */}
              {isOpen && rect
                ? createPortal(
                    <div
                      style={{
                        position: 'fixed',
                        top: rect.bottom + 6,
                        left: rect.left,
                        width: rect.width,
                      }}
                      className="panel z-[100] overflow-hidden rounded-lg"
                    >
                      <div className="border-line flex items-center gap-2 border-b px-3 py-2">
                        <Search size={14} className="text-muted shrink-0" aria-hidden="true" />
                        <ComboboxInput
                          autoFocus
                          aria-label={`Search ${label.toLowerCase()}`}
                          placeholder={searchPlaceholder}
                          displayValue={() => query}
                          onChange={(e) => setQuery(e.target.value)}
                          className="text-body text-primary placeholder:text-muted w-full bg-transparent py-0.5 font-sans focus:outline-none"
                        />
                      </div>

                      <ComboboxOptions
                        static
                        className="max-h-64 overflow-auto p-1 focus:outline-none"
                      >
                        <ComboboxOption value={ALL} className={optionRow}>
                          <Typography size="body">{allLabel}</Typography>
                          {value === null ? (
                            <Check size={14} className="text-accent shrink-0" aria-hidden="true" />
                          ) : null}
                        </ComboboxOption>

                        {filtered.map((option) => (
                          <ComboboxOption key={option.id} value={option.id} className={optionRow}>
                            <Typography size={mono ? 'mono-sm' : 'body'} className="truncate">
                              {option.label}
                            </Typography>
                            <span className="flex shrink-0 items-center gap-2">
                              {option.count !== undefined ? (
                                <Typography size="mono-sm" color="muted">
                                  {option.count.toLocaleString()}
                                </Typography>
                              ) : null}
                              {value === option.id ? (
                                <Check size={14} className="text-accent" aria-hidden="true" />
                              ) : null}
                            </span>
                          </ComboboxOption>
                        ))}

                        {filtered.length === 0 ? (
                          <Typography
                            size="body-sm"
                            color="muted"
                            className="block px-2 py-3 text-center"
                          >
                            No matches for “{query}”
                          </Typography>
                        ) : null}
                      </ComboboxOptions>
                    </div>,
                    document.body
                  )
                : null}
            </div>
          );
        }}
      </Combobox>
    </div>
  );
}
