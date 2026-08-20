import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

const sizeMap = {
  sm: 'h-8 text-body-sm pl-2.5 pr-8',
  md: 'h-10 text-body pl-3 pr-9',
} as const;

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: keyof typeof sizeMap;
  options: SelectOption[];
  /** Visually hidden when `hideLabel`, but still read out. */
  label: string;
  hideLabel?: boolean;
  className?: string;
  wrapperClassName?: string;
}

/**
 * A native `<select>` with the design system's skin.
 *
 * Deliberately native rather than a Headless UI listbox: for short, known lists
 * — sort order, rows per page — the browser's own control gives correct
 * keyboard behaviour, screen reader support and mobile pickers for free.
 * `ScopeSelect` exists for the cases native cannot serve, where 727 options need
 * search and counts.
 *
 * The option list itself is drawn by the OS, so it will not match the glass
 * styling. That is the trade.
 */
export default function Select({
  size = 'md',
  options,
  label,
  hideLabel = false,
  id,
  className = '',
  wrapperClassName = '',
  ...restProps
}: SelectProps) {
  const selectId = id ?? `sn-select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      <label
        htmlFor={selectId}
        className={cn(
          'text-caption text-muted font-sans font-semibold uppercase',
          hideLabel && 'sr-only'
        )}
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <select
          data-testid="sn-select"
          id={selectId}
          className={cn(
            'border-line text-primary focus-visible:ring-accent focus-visible:ring-offset-page w-full appearance-none rounded-md border bg-tint/[0.06] font-sans transition-colors duration-150 hover:bg-tint/[0.1] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
            sizeMap[size],
            className
          )}
          {...restProps}
        >
          {options.map((option) => (
            // Options render in the OS menu, so the page's dark tokens do not
            // apply — set a readable colour explicitly.
            <option key={option.value} value={option.value} className="bg-page text-primary">
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          aria-hidden="true"
          className="text-muted pointer-events-none absolute right-3 shrink-0"
        />
      </div>
    </div>
  );
}
