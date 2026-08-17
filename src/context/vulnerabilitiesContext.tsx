import { createContext, ReactNode, useState, useEffect, useContext, useMemo } from 'react';
import { ScanMeta, Vulnerability } from '../utils/types/data';

export type VulnerabilityContextType = {
  data: Vulnerability[];
  /** The groups and repos that were scanned, including any with no findings. */
  meta: ScanMeta;
  isLoading: boolean;
  error: string | null;
};

/** Shape consumers see before the fetch resolves. */
const EMPTY_META: ScanMeta = { groups: {}, repos: {}, imageCount: 0 };

const DATA_URL = '/data/index.json';
const META_URL = '/data/meta.json';

/**
 * Dev-only escape hatch for exercising the error state: load any page with
 * `?failData=1` and both requests point at paths that do not exist.
 *
 * Note the dev server answers unknown paths with index.html and a 200, so this
 * surfaces as a JSON parse failure rather than a 404 — which is also what most
 * SPA hosts would do in production if the data failed to deploy.
 *
 * Compiled out of production builds.
 */
const isJson = (res: Response) => res.headers.get('content-type')?.includes('application/json');

const dataUrls = () => {
  if (
    process.env.NODE_ENV === 'development' &&
    new URLSearchParams(window.location.search).has('failData')
  ) {
    return ['/data/does-not-exist.json', '/data/does-not-exist.json'];
  }

  return [DATA_URL, META_URL];
};

export const VulnerabilityContext = createContext<VulnerabilityContextType | undefined>(undefined);

export function VulnerabilityProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Vulnerability[]>([]);
  const [meta, setMeta] = useState<ScanMeta>(EMPTY_META);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [indexUrl, metaUrl] = dataUrls();

        // Two independent files, so request them together rather than waiting
        // for the 6.65MB index before even starting the 20KB meta.
        const [indexRes, metaRes] = await Promise.all([
          fetch(indexUrl, { signal: controller.signal }),
          fetch(metaUrl, { signal: controller.signal }),
        ]);

        if (!indexRes.ok) {
          throw new Error(`${indexRes.status} - could not load findings`);
        }
        if (!metaRes.ok) {
          throw new Error(`${metaRes.status} - could not load scan metadata`);
        }

        // A missing file does not necessarily 404. This dev server, and most SPA
        // hosts, answer unknown paths with index.html and a 200 so client-side
        // routing works — so the status check above passes and `.json()` then
        // fails on '<!DOCTYPE'. Checking the content type turns that into a
        // sentence that says what actually went wrong.
        if (!isJson(indexRes)) {
          throw new Error('Vulnerability data is missing or was not deployed');
        }
        if (!isJson(metaRes)) {
          throw new Error('Scan metadata is missing or was not deployed');
        }

        const [records, scanMeta] = await Promise.all([indexRes.json(), metaRes.json()]);

        setData(records);
        setMeta(scanMeta);
      } catch (err) {
        // This run was superseded — its failure is expected and its result
        // unwanted, so it must not touch state the live run now owns.
        if (controller.signal.aborted) return;

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        // `finally` runs on every exit path, including the early return above.
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, []);

  const value = useMemo(() => ({ data, meta, isLoading, error }), [data, meta, isLoading, error]);

  return <VulnerabilityContext.Provider value={value}>{children}</VulnerabilityContext.Provider>;
}

export const useVulnerabilities = () => {
  const context = useContext(VulnerabilityContext);

  if (!context) {
    throw new Error('useVulnerabilities must be used within a VulnerabilityProvider');
  }

  return context;
};
