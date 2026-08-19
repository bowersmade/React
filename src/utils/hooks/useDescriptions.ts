import { useEffect, useState } from 'react';
import { cleanAdvisoryText } from '../helpers/format';

/** CVE id -> advisory text. One entry per distinct CVE, not per finding. */
export type DescriptionMap = Record<string, string>;

const DESCRIPTIONS_URL = '/data/descriptions.json';

/**
 * Advisory text is fetched on demand rather than with the main dataset.
 *
 * It is 2.1MB on top of the 5MB the findings already cost, and it is only ever
 * read one CVE at a time — by the detail drawer, and by the comparison screen.
 * Most sessions never open either, so paying for it at boot would slow down
 * every visit to buy something most of them do not use.
 *
 * The cache is module-scoped rather than a context so the fetch is shared
 * without a provider: the drawer and the compare page can both ask for it, in
 * any order, and only the first ask hits the network. `inFlight` is what makes
 * that true even when both mount in the same tick — without it, two components
 * asking simultaneously would each start their own request.
 */
let cache: DescriptionMap | null = null;
let inFlight: Promise<DescriptionMap> | null = null;

function loadDescriptions(): Promise<DescriptionMap> {
  if (cache) return Promise.resolve(cache);

  if (!inFlight) {
    inFlight = fetch(DESCRIPTIONS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} - could not load advisory text`);
        return res.json();
      })
      .then((raw: DescriptionMap) => {
        // Cleaned once here rather than at every render. 2,713 entries is a
        // single cheap pass, and it means no consumer has to remember to do it.
        const cleaned: DescriptionMap = {};
        for (const cve of Object.keys(raw)) {
          cleaned[cve] = cleanAdvisoryText(raw[cve]);
        }
        cache = cleaned;
        return cleaned;
      })
      .catch((err) => {
        // Cleared so a failure is retried the next time something asks, rather
        // than poisoning the cache with a rejected promise for the session.
        inFlight = null;
        throw err;
      });
  }

  return inFlight;
}

export interface UseDescriptionsResult {
  descriptions: DescriptionMap | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * `enabled` defers the fetch until something actually needs the text — pass
 * `activeRow !== null` from a drawer, or `true` from a screen that always shows
 * it. Once loaded it stays loaded for the session.
 */
export function useDescriptions(enabled: boolean): UseDescriptionsResult {
  const [descriptions, setDescriptions] = useState<DescriptionMap | null>(cache);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || cache) return;

    let active = true;
    setIsLoading(true);
    setError(null);

    loadDescriptions()
      .then((map) => {
        if (!active) return;
        setDescriptions(map);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { descriptions: descriptions ?? cache, isLoading, error };
}
