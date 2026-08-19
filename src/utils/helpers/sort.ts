import { type SortDirection } from '../../components/molecules/sort-header/sort-header';
import { severityOrder, type SeverityKey, type Vulnerability } from '../types/data';

export type SortKey = 'cve' | 'severity' | 'packageName' | 'published' | 'cvss';

type Compare = (a: Vulnerability, b: Vulnerability) => number;

/**
 * Severity as a number so it can be subtracted, worst highest.
 *
 * Sorting the raw strings gives critical, high, low, medium — alphabetical order
 * puts "low" above "medium", which is nonsense to a user.
 *
 * severityOrder lists worst first because that is the display order, so it is
 * reversed here. Ascending has to mean "low at the top", or clicking a column
 * header for ascending order shows the criticals.
 */
const severityRank = Object.fromEntries(
  severityOrder.map((s, i) => [s, severityOrder.length - 1 - i])
) as Record<SeverityKey, number>;

/**
 * Ascending order for each sortable column. `direction` flips the result, so
 * each of these only has to describe one direction.
 */
const comparators: Record<SortKey, Compare> = {
  severity: (a, b) => severityRank[a.severity] - severityRank[b.severity],
  cvss: (a, b) => a.cvss - b.cvss,
  // ISO dates sort correctly as strings — biggest unit first, zero padded.
  published: (a, b) => a.published.localeCompare(b.published),
  cve: (a, b) => a.cve.localeCompare(b.cve),
  packageName: (a, b) => a.packageName.localeCompare(b.packageName),
};

/**
 * Applied whenever the chosen column ties, which here is most of the time:
 * severity has 4 distinct values across 236,656 rows and packageName has 775,
 * so sorting by either leaves blocks of thousands in arbitrary order.
 *
 * Worst first, then by id. `id` is unique, so no two rows ever compare equal and
 * the order cannot wobble between renders.
 *
 * Deliberately not flipped by `direction`: sorting packages A-Z should not also
 * invert the severity ordering inside each package.
 */
const tiebreak: Compare = (a, b) =>
  severityRank[b.severity] - severityRank[a.severity] || b.cvss - a.cvss || a.id - b.id;

/**
 * Returns a new sorted array. Never sorts in place — `filterData` hands back the
 * original array when no filters are set, and sorting that would reorder the
 * dataset every other page is reading.
 */
export const sortFindings = (
  data: Vulnerability[],
  key: SortKey | null,
  direction: SortDirection
): Vulnerability[] => {
  if (!key) return data;

  const compare = comparators[key];
  const flip = direction === 'desc' ? -1 : 1;

  return [...data].sort((a, b) => flip * compare(a, b) || tiebreak(a, b));
};
