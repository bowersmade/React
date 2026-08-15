import type { LucideIcon } from 'lucide-react';
import { Inbox, TriangleAlert } from 'lucide-react';
import { Typography } from '../../foundations/typography/typography';
import Button from '../../atoms/button/button';
import { cn } from '../../../utils/cn';

type Variant = 'empty' | 'error';

const variantMap: Record<Variant, { icon: LucideIcon; iconClass: string }> = {
  empty: { icon: Inbox, iconClass: 'text-muted' },
  error: { icon: TriangleAlert, iconClass: 'text-critical' },
};

export interface StateMessageProps {
  variant?: Variant;
  title: string;
  /** One line explaining what happened and, ideally, what to do next. */
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function StateMessage({
  variant = 'empty',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}: StateMessageProps) {
  const { icon: DefaultIcon, iconClass } = variantMap[variant];
  const Icon = icon ?? DefaultIcon;

  return (
    <div
      data-testid="sn-state-message"
      role={variant === 'error' ? 'alert' : undefined}
      className={cn('flex flex-col items-center px-6 py-12 text-center', className)}
    >
      <span
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]',
          iconClass
        )}
      >
        <Icon size={22} aria-hidden="true" />
      </span>

      <Typography size="h3">{title}</Typography>

      {description ? (
        <Typography size="body-sm" color="muted" className="mt-2 max-w-sm">
          {description}
        </Typography>
      ) : null}

      {actionLabel && onAction ? (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
