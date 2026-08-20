import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Search, X } from 'lucide-react';
import { Typography } from '../../foundations/typography/typography';
import Badge from '../../atoms/badge/badge';
import { cn } from '../../../utils/cn';

export interface Suggestion {
  /** Passed back to `onSelect`. */
  id: string;
  label: string;
  /** Where the match came from: "CVE", "Package", "Image". */
  kind?: string;
  /** Matching findings, shown right-aligned. */
  count?: number;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired when a suggestion is picked, rather than on every keystroke. */
  onSelect?: (suggestion: Suggestion) => void;
  /** Already filtered and ranked by the caller — this component only draws them. */
  suggestions?: Suggestion[];
  placeholder?: string;
  /** Shown under the field when there is a query but no matches. */
  emptyMessage?: string;
  className?: string;
}

/**
 * The list page's search box, with a suggestion menu.
 *
 * Headless UI's Combobox supplies the keyboard handling, escape, click-outside
 * and ARIA wiring. `anchor` positions the menu through Floating UI, which
 * portals it — necessary because the toolbar sits inside a glass card, and
 * `backdrop-filter` creates a stacking context an inline menu cannot escape.
 *
 * Matching is the caller's job. This deliberately knows nothing about the
 * dataset so it can be debounced, memoised or moved to a worker without
 * touching the UI.
 */
export default function SearchInput({
  value,
  onChange,
  onSelect,
  suggestions = [],
  placeholder = 'Search by CVE, package, or image…',
  emptyMessage = 'No matches',
  className = '',
}: SearchInputProps) {
  const showEmpty = value.trim().length > 0 && suggestions.length === 0;

  return (
    <Combobox
      immediate
      value={null}
      onChange={(picked: Suggestion | null) => picked && onSelect?.(picked)}
    >
      <div className={cn('relative flex items-center', className)}>
        <Search
          size={16}
          aria-hidden="true"
          className="text-muted pointer-events-none absolute left-3"
        />

        <ComboboxInput
          aria-label="Search findings"
          placeholder={placeholder}
          displayValue={() => value}
          onChange={(e) => onChange(e.target.value)}
          className="border-line text-primary placeholder:text-muted text-body focus-visible:ring-accent focus-visible:ring-offset-page h-10 w-full rounded-pill border bg-tint/[0.06] pr-9 pl-9 font-sans transition-colors duration-150 hover:bg-tint/[0.1] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        />

        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="text-muted hover:text-primary focus-visible:ring-accent absolute right-2 flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {suggestions.length > 0 || showEmpty ? (
        <ComboboxOptions
          anchor="bottom start"
          className="panel z-[100] mt-1.5 max-h-72 w-[var(--input-width)] overflow-auto rounded-lg p-1 focus:outline-none"
        >
          {showEmpty ? (
            <Typography size="body-sm" color="muted" className="px-3 py-4 text-center">
              {emptyMessage}
            </Typography>
          ) : null}

          {suggestions.map((suggestion) => (
            <ComboboxOption
              key={suggestion.id}
              value={suggestion}
              className="data-[focus]:bg-accent/15 flex cursor-pointer items-center justify-between gap-3 rounded-sm px-2 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                {suggestion.kind ? <Badge>{suggestion.kind}</Badge> : null}
                <Typography size="body" className="truncate">
                  {suggestion.label}
                </Typography>
              </span>

              {suggestion.count !== undefined ? (
                <Typography size="mono-sm" color="muted" className="shrink-0">
                  {suggestion.count.toLocaleString()}
                </Typography>
              ) : null}
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      ) : null}
    </Combobox>
  );
}
