import { forwardRef, type InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

const sizeMap = {
  sm: 'h-8 text-body-sm',
  md: 'h-10 text-body',
} as const;

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: keyof typeof sizeMap;
  /** Rendered inside the field on the left — a magnifier for search, say. */
  icon?: LucideIcon;
  /** Shows a clear button once there is a value. Requires `onClear`. */
  onClear?: () => void;
  /** Visible label. Omit only when an adjacent element already names the field. */
  label?: string;
  /** Replaces the helper line and turns the border red. */
  error?: string;
  /** Sits under the field in muted text. */
  hint?: string;
  className?: string;
  /** Applied to the wrapper rather than the input. */
  wrapperClassName?: string;
}

/**
 * Single-line text field. Used for the list search, and for the text filters in
 * the filter modal.
 *
 * Forwards its ref so callers can focus it — the command palette opens straight
 * into the search box, and the filter modal focuses its first field.
 */
const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    size = 'md',
    icon: Icon,
    onClear,
    label,
    error,
    hint,
    id,
    value,
    disabled,
    className = '',
    wrapperClassName = '',
    ...restProps
  },
  ref
) {
  // Only needed to tie the label and the helper line to the input; falls back to
  // a generated id so callers are not forced to invent one.
  const inputId = id ?? `sn-input-${label?.toLowerCase().replace(/\s+/g, '-') ?? 'field'}`;
  const describedBy = error || hint ? `${inputId}-help` : undefined;
  const showClear = Boolean(onClear) && Boolean(value);

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label ? (
        <label htmlFor={inputId} className="text-caption text-muted font-sans font-semibold uppercase">
          {label}
        </label>
      ) : null}

      <div className="relative flex items-center">
        {Icon ? (
          <Icon
            size={16}
            aria-hidden="true"
            className="text-muted pointer-events-none absolute left-3 shrink-0"
          />
        ) : null}

        <input
          data-testid="sn-text-input"
          ref={ref}
          id={inputId}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'text-primary placeholder:text-muted focus-visible:ring-accent focus-visible:ring-offset-page w-full rounded-md border bg-white/[0.06] font-sans transition-colors duration-150 hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
            sizeMap[size],
            Icon ? 'pl-9' : 'pl-3',
            showClear ? 'pr-9' : 'pr-3',
            error ? 'border-critical' : 'border-line',
            className
          )}
          {...restProps}
        />

        {showClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear"
            className="text-muted hover:text-primary focus-visible:ring-accent absolute right-2 flex h-6 w-6 items-center justify-center rounded-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {error || hint ? (
        <span
          id={describedBy}
          role={error ? 'alert' : undefined}
          className={cn('text-caption font-sans', error ? 'text-critical' : 'text-muted')}
        >
          {error ?? hint}
        </span>
      ) : null}
    </div>
  );
});

export default TextInput;
