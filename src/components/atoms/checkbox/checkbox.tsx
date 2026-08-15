import type { InputHTMLAttributes } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  checked?: boolean;
  /** Some but not all children selected — renders a dash instead of a tick. */
  indeterminate?: boolean;
  /** Visible label. Omit for table rows, but then pass `aria-label`. */
  label?: string;
  className?: string;
}

export default function Checkbox({
  checked = false,
  indeterminate = false,
  label,
  disabled,
  className = '',
  ...restProps
}: CheckboxProps) {
  const filled = checked || indeterminate;

  const box = (
    <span className="relative inline-flex shrink-0">
      <input
        data-testid="sn-checkbox"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-checked={indeterminate ? 'mixed' : checked}
        className="peer h-4 w-4 cursor-pointer appearance-none rounded-xs border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 border-white/25 bg-white/[0.06] hover:border-white/40 checked:border-accent checked:bg-accent"
        {...restProps}
      />
      {filled ? (
        <span className="text-page pointer-events-none absolute inset-0 flex items-center justify-center">
          {indeterminate ? (
            <Minus size={12} strokeWidth={3} aria-hidden="true" />
          ) : (
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          )}
        </span>
      ) : null}
    </span>
  );

  if (!label) {
    return <span className={cn('inline-flex', className)}>{box}</span>;
  }

  return (
    <label
      className={cn(
        'text-body text-secondary inline-flex cursor-pointer items-center gap-2.5 font-sans',
        disabled && 'cursor-not-allowed opacity-40',
        className
      )}
    >
      {box}
      {label}
    </label>
  );
}
