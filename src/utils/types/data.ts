/**
 * Review verdict attached by Kai. Only dismissals are recorded — there is no
 * "confirmed real risk" state, so `''` means nobody has looked at it yet.
 * 88% of findings (207,651) are unreviewed.
 */
export type KaiStatus = 'invalid - norisk' | 'ai-invalid-norisk' | '';

export const severityOrder = ['critical', 'high', 'medium', 'low'] as const;

export type SeverityKey = (typeof severityOrder)[number];

export const DASHBOARD_TREND_MONTHS = 12;

/** One finding: a CVE as it appears in one scanned container image. */
export interface Vulnerability {
  /**
   * Assigned by the loader: the record's position in index.json.
   *
   * The dataset has no natural key. One image can carry the same CVE through
   * several packages, so cve + image collides on 43,089 rows, and 3 records are
   * identical across every field there is. Identity has to be given, not derived.
   */
  id: number;
  cve: string;
  severity: SeverityKey;
  cvss: number;
  packageName: string;
  packageVersion: string;
  packageType: string;
  /** ISO date, 'YYYY-MM-DD'. */
  published: string;
  /** Raw scanner text, e.g. "fixed in 6.1.6, 6.0.19, 5.3.34". */
  fixStatus: string;
  hasFix: boolean;
  kaiStatus: KaiStatus;
  riskFactors: string[];
  /** Usually NVD, but some findings link to vendor trackers instead. */
  link: string;
  group: string;
  repo: string;
  /** Full registry path, e.g. "quay.example.priv/1356-ci-cd/app:1.0.5". */
  image: string;
}

export interface TrendPoint {
  /** 'YYYY-MM'. */
  month: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ScanMeta {
  groups: Record<string, number>;
  repos: Record<string, number>;
  /**
   * Group -> the repositories scanned under it. A repository name can appear
   * under more than one group (13 do), so this cannot be inverted to a single
   * repo -> group map.
   */
  groupRepos: Record<string, string[]>;
  imageCount: number;
}

/**
 * Findings dismissed during review, split by who dismissed them. Unreviewed is
 * not tracked — it is whatever is left over, `total - manuallyCleared - aiCleared`.
 */
export interface ReviewCount {
  manuallyCleared: number;
  aiCleared: number;
}

export interface Filters {
  group: string | null;
  repo: string | null;
  hideManuallyCleared: boolean;
  hideAiCleared: boolean;
}
