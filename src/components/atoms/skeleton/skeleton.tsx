import { cn } from '../../../utils/cn';

const shapeMap = {
  text: 'h-4 rounded',
  block: 'rounded-lg',
  circle: 'rounded-full',
} as const;

export interface SkeletonProps {
  shape?: keyof typeof shapeMap;
  className?: string;
}

export default function Skeleton({ shape = 'text', className = '' }: SkeletonProps) {
  return (
    <div
      data-testid="sn-skeleton"
      aria-hidden="true"
      className={cn('skeleton animate-shimmer', shapeMap[shape], className)}
    />
  );
}
