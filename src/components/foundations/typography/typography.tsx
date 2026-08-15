import type { ComponentProps, ElementType, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

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
  mono: 'text-mono',
  'mono-sm': 'text-mono-sm',
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
  disabled: 'text-disabled',
  critical: 'text-critical',
  high: 'text-high',
  medium: 'text-medium',
  low: 'text-low',
  info: 'text-info',
  resolved: 'text-resolved',
  accent: 'text-accent',
  teal: 'text-teal',
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
  mono: 'span',
  'mono-sm': 'span',
};

const defaultFontMap: Record<keyof typeof sizeMap, keyof typeof fontMap> = {
  display: 'display',
  h1: 'display',
  h2: 'display',
  h3: 'display',
  body: 'sans',
  'body-sm': 'sans',
  caption: 'sans',
  mono: 'mono',
  'mono-sm': 'mono',
};

/** Default weight per size, matching the Figma type specimens. Override with `weight`. */
const defaultWeightMap: Record<keyof typeof sizeMap, keyof typeof weightMap> = {
  display: 'bold',
  h1: 'bold',
  h2: 'semiBold',
  h3: 'semiBold',
  body: 'regular',
  'body-sm': 'regular',
  caption: 'semiBold',
  mono: 'medium',
  'mono-sm': 'regular',
};

interface PolymorphicTypographyProps {
  as?: TypographyTag;
  size?: keyof typeof sizeMap;
  /** Defaults per size (Display bold, H2/H3 semiBold, Caption semiBold, Mono medium). */
  weight?: keyof typeof weightMap;
  /** Defaults to Gabarito for headings, Inter for body. Use 'mono' for CVE IDs, versions and registry paths. */
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
  weight,
  font,
  color = 'primary',
  truncate = false,
  className = '',
  children,
  ...restProps
}: TypographyProps<T>) => {
  const Component = as ?? defaultTagMap[size];
  const fontClass = fontMap[font ?? defaultFontMap[size]];
  const weightClass = weightMap[weight ?? defaultWeightMap[size]];

  return (
    <Component
      data-testid="sn-typography"
      className={cn(
        'group not-italic',
        fontClass,
        sizeMap[size],
        weightClass,
        colorMap[color],
        truncate && 'relative truncate',
        className
      )}
      {...restProps}
    >
      {children}
      {truncate ? (
        <span
          className={cn(
            'glass-2 text-secondary text-caption absolute z-20 hidden max-w-sm rounded-sm px-2 py-1 text-left font-sans break-words whitespace-normal group-hover:flex'
          )}
        >
          {children}
        </span>
      ) : null}
    </Component>
  );
};

export { Typography };
