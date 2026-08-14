import type { ComponentProps, ElementType, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export type TypographyTag =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'strong'
  | 'em'
  | 'small'
  | 'b'
  | 'i'
  | 'u';

const weightMap = {
  regular: 'font-normal',
  medium: 'font-medium',
  semiBold: 'font-semibold',
  bold: 'font-bold',
} as const;

const sizeMap = {
  display: 'text-display',
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  body: 'text-body',
  'body-sm': 'text-body-sm',
  caption: 'text-caption',
} as const;

const fontMap = {
  display: 'font-display',
  sans: 'font-sans',
  mono: 'font-mono',
} as const;

const colorMap = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-muted',
  critical: 'text-critical',
  high: 'text-high',
  medium: 'text-medium',
  low: 'text-low',
  info: 'text-info',
  resolved: 'text-resolved',
  white: 'text-white',
  inherit: 'text-inherit',
} as const;

const defaultTagMap: Record<keyof typeof sizeMap, TypographyTag> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body: 'p',
  'body-sm': 'p',
  caption: 'span',
};

const defaultFontMap: Record<keyof typeof sizeMap, keyof typeof fontMap> = {
  display: 'display',
  h1: 'display',
  h2: 'display',
  h3: 'display',
  body: 'sans',
  'body-sm': 'sans',
  caption: 'sans',
};

interface PolymorphicTypographyProps {
  as?: TypographyTag;
  size?: keyof typeof sizeMap;
  weight?: keyof typeof weightMap;
  font?: keyof typeof fontMap;
  color?: keyof typeof colorMap;
  truncate?: boolean;
  className?: string;
  children?: ReactNode;
}

export type TypographyProps<T extends ElementType> = PolymorphicTypographyProps &
  Omit<ComponentProps<T>, keyof PolymorphicTypographyProps>;

const Typography = <T extends ElementType = 'p'>({
  as,
  size = 'body',
  weight = 'regular',
  font,
  color = 'primary',
  truncate = false,
  className = '',
  children,
  ...restProps
}: TypographyProps<T>) => {
  const Component = as ?? defaultTagMap[size];
  const fontClass = fontMap[font ?? defaultFontMap[size]];

  return (
    <Component
      data-testid="sn-typography"
      className={twMerge(
        'group not-italic',
        fontClass,
        sizeMap[size],
        weightMap[weight],
        colorMap[color],
        truncate && 'relative truncate',
        className
      )}
      {...restProps}
    >
      {children}
      {truncate ? (
        <span
          className={twMerge(
            'border-line text-secondary text-caption absolute z-20 hidden max-w-sm rounded border bg-white px-2 py-1 text-left font-sans break-words whitespace-normal shadow-sm group-hover:flex'
          )}
        >
          {children}
        </span>
      ) : null}
    </Component>
  );
};

export { Typography };
