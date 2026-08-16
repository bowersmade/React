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
        // Two independent files, so request them together rather than waiting
        // for the 6.65MB index before even starting the 20KB meta.
        const [indexRes, metaRes] = await Promise.all([
          fetch('/data/index.json', { signal: controller.signal }),
          fetch('/data/meta.json', { signal: controller.signal }),
        ]);

        if (!indexRes.ok) {
          throw new Error(`${indexRes.status} - could not load findings`);
        }
        if (!metaRes.ok) {
          throw new Error(`${metaRes.status} - could not load scan metadata`);
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

  const value = useMemo(
    () => ({ data, meta, isLoading, error }),
    [data, meta, isLoading, error]
  );

  return <VulnerabilityContext.Provider value={value}>{children}</VulnerabilityContext.Provider>;
}

export const useVulnerabilities = () => {
  const context = useContext(VulnerabilityContext);

  if (!context) {
    throw new Error('useVulnerabilities must be used within a VulnerabilityProvider');
  }

  return context;
};
