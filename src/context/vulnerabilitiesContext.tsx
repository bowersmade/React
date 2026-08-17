import { createContext, ReactNode, useState, useEffect, useContext, useMemo } from 'react';
import { KaiStatus, ScanMeta, SeverityKey, Vulnerability } from '../utils/types/data';

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

/**
 * index.json ships positionally: field names once, then one array of values per
 * finding. Repeating the 14 keys on every record cost ~37MB.
 */
type EncodedIndex = {
  fields: string[];
  rows: unknown[][];
};

/**
 * Turns the positional payload back into the objects the rest of the app uses.
 *
 * Column positions are read from `fields` rather than hardcoded, so reordering
 * the producer's list cannot silently shift every value into the wrong
 * property — a mismatch throws here instead of rendering nonsense.
 */
const decodeIndex = (payload: EncodedIndex): Vulnerability[] => {
  const fields = payload?.fields;
  const rows = payload?.rows;

  if (!Array.isArray(fields) || !Array.isArray(rows)) {
    throw new Error('Vulnerability data is not in the expected { fields, rows } format');
  }

  const at = (name: string) => {
    const index = fields.indexOf(name);
    if (index === -1) {
      throw new Error(`Vulnerability data is missing the "${name}" column`);
    }
    return index;
  };

  const iCve = at('cve');
  const iSeverity = at('severity');
  const iCvss = at('cvss');
  const iPackageName = at('packageName');
  const iPackageVersion = at('packageVersion');
  const iPackageType = at('packageType');
  const iPublished = at('published');
  const iFixStatus = at('fixStatus');
  const iKaiStatus = at('kaiStatus');
  const iRiskFactors = at('riskFactors');
  const iLink = at('link');
  const iGroup = at('group');
  const iRepo = at('repo');
  const iImage = at('image');

  const decoded: Vulnerability[] = new Array(rows.length);

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const fixStatus = row[iFixStatus] as string;

    decoded[i] = {
      cve: row[iCve] as string,
      severity: row[iSeverity] as SeverityKey,
      cvss: row[iCvss] as number,
      packageName: row[iPackageName] as string,
      packageVersion: row[iPackageVersion] as string,
      packageType: row[iPackageType] as string,
      published: row[iPublished] as string,
      fixStatus,
      // Not stored — it is exactly this expression for every record.
      hasFix: fixStatus.startsWith('fixed'),
      kaiStatus: row[iKaiStatus] as KaiStatus,
      riskFactors: row[iRiskFactors] as string[],
      link: row[iLink] as string,
      group: row[iGroup] as string,
      repo: row[iRepo] as string,
      image: row[iImage] as string,
    };
  }

  return decoded;
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

        if (!isJson(indexRes)) {
          throw new Error('Vulnerability data is missing or was not deployed');
        }
        if (!isJson(metaRes)) {
          throw new Error('Scan metadata is missing or was not deployed');
        }

        const [payload, scanMeta] = await Promise.all([indexRes.json(), metaRes.json()]);

        setData(decodeIndex(payload));
        setMeta(scanMeta);
      } catch (err) {
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
