/**
 * Recharts renders SVG and needs literal colour values, not Tailwind classes.
 * These mirror the custom properties in src/styles/global.css — if a token
 * changes there, change it here too.
 */
export const chartColors = {
  critical: '#DC2626',
  high: '#F97316',
  medium: '#D97706',
  low: '#4F46E5',
  info: '#6366F1',
  resolved: '#16A34A',
  accent: '#00BFFF',
  teal: '#8AF0E3',
} as const;

export type ChartColorKey = keyof typeof chartColors;

/** Tailwind background classes for the same colours, for legends and swatches. */
export const chartColorClasses: Record<ChartColorKey, string> = {
  critical: 'bg-critical',
  high: 'bg-high',
  medium: 'bg-medium',
  low: 'bg-low',
  info: 'bg-info',
  resolved: 'bg-resolved',
  accent: 'bg-accent',
  teal: 'bg-teal',
};

/** Axis, grid and tooltip chrome — muted enough to sit behind the data. */
export const chartChrome = {
  grid: 'rgba(255,255,255,0.08)',
  axis: 'rgba(255,255,255,0.25)',
  axisText: '#9CA4C0',
} as const;

export const severityOrder = ['critical', 'high', 'medium', 'low'] as const;
export type SeverityKey = (typeof severityOrder)[number];

export const severityLabels: Record<SeverityKey, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
