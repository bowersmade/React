import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** Hides the trailing arrow — for dense table cells. */
  hideIcon?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A link that leaves the app — NVD advisories, vendor trackers, GitHub PRs.
 *
 * Opens in a new tab, which needs saying out loud for screen reader users, hence
 * the appended note. `rel="noreferrer"` matters here specifically: these URLs
 * come from scan data rather than from us, and without it the opened page gets a
 * handle on this window via `window.opener`.
 */
export default function ExternalLink({
  href,
  hideIcon = false,
  className = '',
  children,
  ...restProps
}: ExternalLinkProps) {
  return (
    <a
      data-testid="sn-external-link"
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        'text-accent focus-visible:ring-accent focus-visible:ring-offset-page inline-flex items-center gap-1 rounded-xs font-sans underline decoration-transparent underline-offset-2 transition-colors duration-150 hover:decoration-current focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
      {...restProps}
    >
      {children}
      {hideIcon ? null : <ExternalLinkIcon size={13} aria-hidden="true" className="shrink-0" />}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
