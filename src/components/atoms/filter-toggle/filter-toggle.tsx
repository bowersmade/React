import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface FilterToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> {
  label: string;
  icon?: LucideIcon;
  active: boolean;
  /**
   * Number of records this filter removes while active. Rendered beneath the
   * button as "Hiding 11,959" so the control says what it is doing, not just
   * what it is about.
   */
  hiddenCount?: number;
  onToggle?: () => void;
  /** Applied to the outer wrapper, not the button. */
  className?: string;
}

export default function FilterToggle({
  label,
  icon: Icon,
  active,
  hiddenCount,
  onToggle,
  className = '',
  ...restProps
}: FilterToggleProps) {
  const state =
    active && hiddenCount !== undefined
      ? `Hiding ${hiddenCount.toLocaleString()}`
      : active
        ? 'On'
        : 'Off';

  return (
    <span
      data-testid="sn-filter-toggle"
      className={cn('inline-flex flex-col items-center gap-2', className)}
    >
      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        className={cn(
          'rounded-pill focus-visible:ring-accent focus-visible:ring-offset-page inline-flex items-center gap-2 border px-5 py-2.5 font-sans transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          active
            ? 'bg-info border-info text-white hover:bg-info/90'
            : 'border-line text-secondary hover:text-primary bg-tint/[0.04] hover:bg-tint/[0.08]'
        )}
        {...restProps}
      >
        {Icon ? <Icon size={16} aria-hidden="true" className="shrink-0" /> : null}
        <span className="text-body font-medium whitespace-nowrap">{label}</span>
      </button>

      <span
        className={cn(
          'rounded-pill text-caption px-3 py-1 font-medium whitespace-nowrap',
          active ? 'bg-info text-white' : 'text-muted bg-tint/[0.06]'
        )}
      >
        {state}
      </span>
    </span>
  );
}
