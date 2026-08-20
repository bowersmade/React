import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';

const variantMap = {
  primary:
    'bg-accent text-page hover:bg-accent/90 active:bg-accent/80 border border-transparent font-semibold',
  secondary: 'glass text-primary hover:bg-tint/[0.14] active:bg-tint/[0.1]',
  ghost:
    'bg-transparent text-secondary border border-transparent hover:bg-tint/[0.06] hover:text-primary',
  danger:
    'bg-critical text-white hover:bg-critical/90 active:bg-critical/80 border border-transparent',
} as const;

const sizeMap = {
  sm: 'h-8 px-3 gap-1.5 text-body-sm',
  md: 'h-10 px-4 gap-2 text-body',
} as const;

const iconSizeMap = {
  sm: 14,
  md: 16,
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantMap;
  size?: keyof typeof sizeMap;
  /** Rendered before the label. */
  icon?: LucideIcon;
  /** Rendered after the label. */
  trailingIcon?: LucideIcon;
  children?: ReactNode;
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  trailingIcon: TrailingIcon,
  className = '',
  type = 'button',
  children,
  ...restProps
}: ButtonProps) {
  const iconSize = iconSizeMap[size];

  return (
    <button
      data-testid="sn-button"
      type={type}
      className={cn(
        'focus-visible:ring-accent focus-visible:ring-offset-page inline-flex items-center justify-center rounded-md font-sans font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      {...restProps}
    >
      {Icon ? <Icon size={iconSize} aria-hidden="true" /> : null}
      {children}
      {TrailingIcon ? <TrailingIcon size={iconSize} aria-hidden="true" /> : null}
    </button>
  );
}
