import { ScopeOption } from '../../components/molecules/scope-select/scope-select';
import {
  ScanMeta,
  ReviewCount,
  SeverityKey,
  TrendPoint,
  Vulnerability,
  Filters,
} from '../types/data';

export const severityCount = (data: Vulnerability[]): Record<SeverityKey, number> => {
  const count = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const vul of data) {
    if (vul.severity) {
      count[vul.severity] += 1;
    }
  }

  return count;
};

export const buildTrendAnalysis = (data: Vulnerability[]): TrendPoint[] => {
  const trends: Record<string, Record<SeverityKey, number>> = {};

  for (const vul of data) {
    if (!vul.published) continue;

    const month = vul.published.slice(0, 7);

    if (!trends[month]) {
      trends[month] = { critical: 0, high: 0, medium: 0, low: 0 };
    }

    trends[month][vul.severity] += 1;
  }

  return Object.entries(trends)
    .map(([month, counts]) => ({ month, ...counts }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Shared tail of `groupRepoOptions`: a name -> count tally becomes the option
 * shape ScopeSelect renders. Biggest scopes first — the control has its own
 * search field, so alphabetical order would waste the default view.
 *
 * Not exported; nothing outside this file needs it.
 */
const toScopeOptions = (tally: Record<string, number>): ScopeOption[] =>
  Object.entries(tally)
    .map(([id, count]) => ({ id, label: id, count }))
    .sort((a, b) => b.count - a.count);

/**
 * Options for the two scope selectors.
 *
 * `meta` supplies which scopes exist; `data` supplies the counts. Seeding from
 * meta means a scope that was scanned but matches nothing right now still
 * appears, at zero — "scanned, all clear" and "never scanned" are different
 * answers and an absent row merges them. Three groups and repos in this dataset
 * have no findings at all and would otherwise be invisible.
 *
 * Pass the *filtered* records so the counts describe what selecting a scope
 * would actually show.
 */
export const groupRepoOptions = (
  data: Vulnerability[],
  meta: ScanMeta
): { groups: ScopeOption[]; repos: ScopeOption[] } => {
  const groups: Record<string, number> = {};
  const repos: Record<string, number> = {};

  for (const name of Object.keys(meta.groups)) groups[name] = 0;
  for (const name of Object.keys(meta.repos)) repos[name] = 0;

  for (const vul of data) {
    groups[vul.group] = (groups[vul.group] ?? 0) + 1;
    repos[vul.repo] = (repos[vul.repo] ?? 0) + 1;
  }

  return {
    groups: toScopeOptions(groups),
    repos: toScopeOptions(repos),
  };
};

/**
 * Risk factor labels ranked by how often they appear. Every label is returned;
 * RiskVectors truncates to its own `limit`.
 *
 * Nested loop — each record carries a short `riskFactors` array, averaging
 * about four entries.
 */
export const rankRiskVectors = (data: Vulnerability[]): { label: string; count: number }[] => {
  const tally: Record<string, number> = {};

  for (const vul of data) {
    for (const factor of vul.riskFactors) {
      tally[factor] = (tally[factor] ?? 0) + 1;
    }
  }

  return Object.entries(tally)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * How many findings each dismissal verdict accounts for. Unreviewed findings
 * are not tracked — that count is the remainder, `total - the two below`.
 *
 * The switch stays exhaustive so a new verdict in the source data breaks the
 * build here rather than being silently absorbed into a catch-all branch. At
 * runtime it only warns — the parsed JSON is `any`, so an unexpected value is a
 * data problem, and losing one record from a tally beats losing the page.
 */
export const reviewCount = (data: Vulnerability[]): ReviewCount => {
  const count = {
    manuallyCleared: 0,
    aiCleared: 0,
  };

  for (const vul of data) {
    switch (vul.kaiStatus) {
      case 'ai-invalid-norisk':
        count.aiCleared += 1;
        break;
      case 'invalid - norisk':
        count.manuallyCleared += 1;
        break;
      case '':
        // Unreviewed — deliberately not counted.
        break;
      default: {
        const unexpected: never = vul.kaiStatus;
        console.warn(`Unknown kaiStatus, not counted: ${unexpected}`);
      }
    }
  }

  return count;
};

export const filterData = (data: Vulnerability[], filters: Filters): Vulnerability[] => {
  const { group, repo, hideAiCleared, hideManuallyCleared } = filters;

  if (!group && !repo && !hideManuallyCleared && !hideAiCleared) return data;
  return data.filter((v) => {
    if (group && v.group !== group) return false;
    if (repo && v.repo !== repo) return false;
    if (hideManuallyCleared && v.kaiStatus === 'invalid - norisk') return false;
    if (hideAiCleared && v.kaiStatus === 'ai-invalid-norisk') return false;
    return true;
  });
};
