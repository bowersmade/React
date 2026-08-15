import type { ComponentProps, ElementType, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

const elevationMap = {
  1: 'glass',
  2: 'glass-2',
  3: 'glass-3',
} as const;

interface PolymorphicCardProps {
  as?: ElementType;
  /** 1 = subtle card, 2 = floating / popover, 3 = modal / dialog */
  elevation?: keyof typeof elevationMap;
  /** Adds hover lift + pointer affordance. Pair with `as="button"` or `as={Link}`. */
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
}

export type CardProps<T extends ElementType> = PolymorphicCardProps &
  Omit<ComponentProps<T>, keyof PolymorphicCardProps>;

export default function Card<T extends ElementType = 'div'>({
  as,
  elevation = 1,
  interactive = false,
  className = '',
  children,
  ...restProps
}: CardProps<T>) {
  const Component = as ?? 'div';

  return (
    <Component
      data-testid="sn-card"
      className={cn(
        'rounded-2xl',
        elevationMap[elevation],
        interactive &&
          'focus-visible:ring-accent focus-visible:ring-offset-page cursor-pointer text-left transition-all duration-150 hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
      {...restProps}
    >
      {children}
    </Component>
  );
}
