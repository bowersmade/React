import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import AppHeader from '../organisms/app-header/app-header';
import CommandPalette from '../organisms/command-palette/command-palette';
import StateMessage from '../molecules/state-message/state-message';
import { useVulnerabilities } from '../../context/vulnerabilitiesContext';
import type { Vulnerability } from '../../utils/types/data';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, error } = useVulnerabilities();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  /**
   * ⌘K / Ctrl+K, bound at the document because the shortcut has to work
   * wherever focus happens to be.
   *
   * `preventDefault` matters: ⌘K is Firefox's shortcut for its own search bar,
   * so without it the browser's UI opens over ours.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setIsSearchOpen((prev) => !prev);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  /**
   * Opening a finding is a navigation to the list with `?finding=<id>` — see
   * `useActiveFinding`. Existing params are carried over rather than replaced,
   * so jumping to a finding does not silently throw away the filters someone
   * had set up.
   */
  const openFinding = useCallback(
    (finding: Vulnerability) => {
      const params = new URLSearchParams(location.search);
      params.set('finding', String(finding.id));
      navigate({ pathname: '/vulnerabilities', search: params.toString() });
    },
    [navigate, location.search]
  );

  return (
    <div className="bg-page relative min-h-screen">
      {/*
        Ambient colour clouds live in their own clipping layer so the content
        layer never needs `overflow-hidden`, which would cut off open dropdowns.
      */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="glow bg-accent/25 top-[2%] left-[6%] h-[500px] w-[500px]" />
        <div className="glow bg-teal/15 top-[30%] right-[4%] h-[600px] w-[600px]" />
        <div className="glow bg-info/25 top-[65%] left-[2%] h-[450px] w-[450px]" />
      </div>

      {/* Header and page content share one container so they align. */}
      <div className="relative mx-auto max-w-[1440px] p-10">
        <AppHeader onSearchClick={() => setIsSearchOpen(true)} />
        <main className="mt-8">
          {error ? (
            <StateMessage
              variant="error"
              title="Couldn't load vulnerability data"
              description={
                error ||
                'The request failed without a reason given. Check your connection and try again.'
              }
            />
          ) : (
            children
          )}
        </main>
      </div>

      <CommandPalette
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        data={data}
        onSelect={openFinding}
      />
    </div>
  );
}
