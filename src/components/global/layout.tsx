import type { ReactNode } from 'react';
import AppHeader from '../organisms/app-header/app-header';
import StateMessage from '../molecules/state-message/state-message';
import { useVulnerabilities } from '../../context/vulnerabilitiesContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { error } = useVulnerabilities();

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
        <AppHeader
        // onSearchClick={() => setSearchOpen(true)}
        />
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
    </div>
  );
}
