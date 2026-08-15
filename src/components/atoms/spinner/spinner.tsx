import { LoaderCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';

const sizeMap = {
  sm: 14,
  md: 20,
  lg: 32,
} as const;

export interface SpinnerProps {
  size?: keyof typeof sizeMap;
  label?: string;
  className?: string;
}

export default function Spinner({ size = 'md', label = 'Loading', className = '' }: SpinnerProps) {
  return (
    <span
      data-testid="sn-spinner"
      role="status"
      className={cn('text-muted inline-flex items-center', className)}
    >
      <LoaderCircle size={sizeMap[size]} className="animate-spin" aria-hidden="true" />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
