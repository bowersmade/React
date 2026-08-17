import { Search, ShieldCheck } from 'lucide-react';
import { Typography } from '../../foundations/typography/typography';
import { cn } from '../../../utils/cn';

export interface AppHeaderProps {
  /** Shown in the search field before the user types. */
  searchPlaceholder?: string;
  userName?: string;
  userRole?: string;
  /** Opens the command palette. Wire to search state. */
  onSearchClick?: () => void;
  className?: string;
}

export default function AppHeader({
  searchPlaceholder = 'Search 236k+ findings by CVE, package name, or image…',
  userName = 'Devon S.',
  userRole = 'SEC-LEAD',
  onSearchClick,
  className = '',
}: AppHeaderProps) {
  return (
    <header className={cn('flex items-center gap-6', className)}>
      <div className="flex shrink-0 items-center gap-3">
        <span className="glass text-accent flex h-10 w-10 items-center justify-center rounded-md">
          <ShieldCheck size={20} aria-hidden="true" />
        </span>
        <Typography size="h2" as="span">
          SENTINEL
        </Typography>
      </div>

      <button
        type="button"
        onClick={onSearchClick}
        className="glass rounded-pill focus-visible:ring-accent focus-visible:ring-offset-page mx-auto flex w-full max-w-xl items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Search size={16} className="text-muted shrink-0" aria-hidden="true" />
        <Typography size="body" color="muted" className="truncate">
          {searchPlaceholder}
        </Typography>
        <Typography
          size="caption"
          color="muted"
          as="span"
          className="border-line ml-auto shrink-0 rounded-sm border px-1.5 py-0.5"
        >
          ⌘K
        </Typography>
      </button>

      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span className="bg-info/40 text-primary text-body-sm flex h-10 w-10 items-center justify-center rounded-md font-semibold">
            {userName.charAt(0)}
          </span>
          <span className="hidden flex-col sm:flex">
            <Typography size="body-sm" as="span">
              {userName}
            </Typography>
            <Typography size="caption" color="muted" as="span" className="uppercase">
              {userRole}
            </Typography>
          </span>
        </div>
      </div>
    </header>
  );
}
