import type { Vulnerability } from '../types/data';

/**
 * How many results the palette will show.
 *
 * A command palette is for jumping to a known thing, not for browsing — past a
 * couple of screenfuls you should be narrowing the query instead. The list page
 * is the right tool for "show me everything matching".
 */
export const SEARCH_RESULT_LIMIT = 50;

/**
 * How many matches are scored before ranking gives up and takes what it has.
 *
 * A full pass over 236,656 rows costs ~30ms, so scanning is not the problem —
 * collecting is. A one-letter query matches nearly every row, and pushing a
 * quarter of a million objects into an array to sort them would be far more
 * expensive than the scan that found them.
 *
 * The consequence, stated plainly: for a query with more than this many hits,
 * ranking is over the first `MAX_SCORED` in dataset order rather than over
 * every match. An exact CVE lower down the file can therefore lose to a prefix
 * match higher up. That only bites on queries broad enough that no ranking
 * would have helped, and those are exactly the queries the list page handles
 * better.
 */
const MAX_SCORED = 500;

export interface SearchResult {
  finding: Vulnerability;
  /** Which field matched, so the result row can say why it is there. */
  field: 'cve' | 'package' | 'image';
}

/** Higher sorts first. */
function score(finding: Vulnerability, needle: string): number | null {
  const cve = finding.cve.toLowerCase();
  if (cve === needle) return 4;
  if (cve.startsWith(needle)) return 3;

  const packageName = finding.packageName.toLowerCase();
  if (packageName.startsWith(needle)) return 2;

  if (cve.includes(needle) || packageName.includes(needle)) return 1;
  if (finding.image.toLowerCase().includes(needle)) return 0;

  return null;
}

function matchedField(finding: Vulnerability, needle: string): SearchResult['field'] {
  if (finding.cve.toLowerCase().includes(needle)) return 'cve';
  if (finding.packageName.toLowerCase().includes(needle)) return 'package';
  return 'image';
}

/**
 * Substring search over CVE, package name and image — the three fields the
 * header's placeholder promises.
 *
 * A plain scan rather than a prebuilt index. Indexing the same fields into
 * lowercase haystacks measured 5.7ms per query against 30ms for the scan, but
 * cost 86ms to build and ~19MB held for the session, to save 24ms on a search
 * that is already debounced behind a deferred value. Not a trade worth making.
 */
export function searchFindings(data: Vulnerability[], query: string): SearchResult[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const scored: { result: SearchResult; rank: number }[] = [];

  for (const finding of data) {
    const rank = score(finding, needle);
    if (rank === null) continue;

    scored.push({ result: { finding, field: matchedField(finding, needle) }, rank });
    if (scored.length >= MAX_SCORED) break;
  }

  // Stable by construction: equal ranks keep dataset order, so results do not
  // reshuffle as the query grows a character.
  scored.sort((a, b) => b.rank - a.rank);

  return scored.slice(0, SEARCH_RESULT_LIMIT).map((entry) => entry.result);
}
