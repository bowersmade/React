import { useEffect, useState } from 'react';

const BREAKPOINT = '(min-width: 890px)';

/**
 * Below ~890px the dashboard's layout genuinely breaks — horizontal
 * overflow, documented in the README's Known limitations rather than fixed
 * outright, given the timeline this shipped on. Gating on it here, in
 * `index.tsx` above every provider, means a narrow viewport gets an honest
 * "use a bigger screen" message instead of the broken layout — and more to
 * the point, never triggers `VulnerabilityProvider`'s fetch of the ~81MB
 * dataset, since nothing below this width could render it usefully anyway.
 *
 * Read synchronously on first render rather than via a `useEffect` that
 * starts `true` and corrects itself — that would still kick off the fetch
 * for one tick before this hook gets a chance to say no.
 */
export function useIsSupportedViewport(): boolean {
  const [matches, setMatches] = useState(
    () => typeof window === 'undefined' || window.matchMedia(BREAKPOINT).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return matches;
}
