import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';

const sizeMap = {
  sm: { box: 'h-7 w-7', icon: 14 },
  md: { box: 'h-9 w-9', icon: 16 },
} as const;

const toneMap = {
  ghost: 'text-muted hover:text-primary hover:bg-white/[0.08]',
  glass: 'glass text-secondary hover:text-primary hover:bg-white/[0.12]',
} as const;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Required — there is no visible text to name this control. */
  label: string;
  size?: keyof typeof sizeMap;
  tone?: keyof typeof toneMap;
  /** Marks a toggle as on, and sets aria-pressed. */
  active?: boolean;
  className?: string;
}

/**
 * A square control carrying only an icon: row actions, sort direction, drawer
 * close, pagination arrows.
 *
 * This is the only way to render an icon-only control — `Button` always shows
 * its children, so it cannot be pressed into service without the label chrome
 * that a dense table row has no room for.
 *
 * `label` is not optional: an icon has no accessible name, so without it a
 * screen reader announces "button" and nothing else.
 */
export default function IconButton({
  icon: Icon,
  label,
  size = 'md',
  tone = 'ghost',
  active = false,
  className = '',
  type = 'button',
  ...restProps
}: IconButtonProps) {
  const { box, icon } = sizeMap[size];

  return (
    <button
      data-testid="sn-icon-button"
      type={type}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      className={cn(
        'focus-visible:ring-accent focus-visible:ring-offset-page inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
        box,
        toneMap[tone],
        active && 'bg-accent/15 text-accent',
        className
      )}
      {...restProps}
    >
      <Icon size={icon} aria-hidden="true" />
    </button>
  );
}
