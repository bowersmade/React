import { ScopeOption } from '../../components/molecules/scope-select/scope-select';
import {
  ScanMeta,
  ReviewCount,
  SeverityKey,
  TrendPoint,
  Vulnerability,
  Filters,
} from '../types/data';

// Gets the count of every severity from vulnerability data
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

/**
 * Loops the list of data and grabs a count of the four vulnerabilities for each month and
 * then sorts them
 */
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
 * This is just a function for converting the groupOptions and repoOptions into the correct format
 */
const toScopeOptions = (tally: Record<string, number>): ScopeOption[] =>
  Object.entries(tally)
    .map(([id, count]) => ({ id, label: id, count }))
    .sort((a, b) => b.count - a.count);

/**
 * Loops through data and meta, meta is grabbing all the groups and repos to start them at 0
 * then we loop data to fill those groups and repos with a count. If we just looped the data
 * there would be items in it that don't appear due to the flattening that occurred during the
 * VulnerbilitiesProvider hook
 */
export const groupOptions = (data: Vulnerability[], meta: ScanMeta): ScopeOption[] => {
  const tally: Record<string, number> = {};

  for (const name of Object.keys(meta.groups)) tally[name] = 0;
  for (const vul of data) tally[vul.group] = (tally[vul.group] ?? 0) + 1;

  return toScopeOptions(tally);
};

export const repoOptions = (
  data: Vulnerability[],
  meta: ScanMeta,
  group: string | null
): ScopeOption[] => {
  const names = group ? (meta.groupRepos[group] ?? []) : Object.keys(meta.repos);

  const tally: Record<string, number> = {};
  for (const name of names) tally[name] = 0;

  for (const vul of data) {
    if (tally[vul.repo] !== undefined) tally[vul.repo] += 1;
  }

  return toScopeOptions(tally);
};

/**
 * Loops the data to grab the riskFactor count and then sorts them
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
 * This loops the data to get the count for a-invalid-norisk and invalid-norisk
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

/**
 * This filter works backwards, instead of filtering every item individually we use one loop
 * and use a !== condition to leave out or keep an item
 */
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
