import { cn } from '../../../utils/cn';

const shapeMap = {
  text: 'h-4 rounded',
  block: 'rounded-lg',
  circle: 'rounded-full',
} as const;

export interface SkeletonProps {
  shape?: keyof typeof shapeMap;
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ shape = 'text', className = '', style }: SkeletonProps) {
  return (
    <div
      data-testid="sn-skeleton"
      aria-hidden="true"
      style={style}
      className={cn('skeleton animate-shimmer', shapeMap[shape], className)}
    />
  );
}
