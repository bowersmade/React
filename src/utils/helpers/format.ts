/**
 * Display helpers. Pure string formatting — no React, no data access.
 */

const DAY = 24 * 60 * 60 * 1000;

/**
 * '2024-04-16' -> '2 days ago'.
 *
 * The table shows relative time because "is this new" is the question being
 * asked while scanning; the exact date matters only once you open a finding, and
 * the drawer shows it there. Anything older than a year falls back to the year
 * so the phrasing does not drift into "14 months ago".
 */
export function relativeDate(iso: string, now: Date = new Date()): string {
  if (!iso) return 'Unknown';

  const then = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(then.getTime())) return iso;

  const days = Math.floor((now.getTime() - then.getTime()) / DAY);

  if (days < 0) return iso;
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 31) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 62) return '1 month ago';
  if (days < 365) return `${Math.floor(days / 30)} months ago`;

  return then.getFullYear().toString();
}

export type FixState = 'available' | 'fixed' | 'none';

/**
 * The scanner's `status` string collapsed into the three states the table shows.
 *
 * Real values in the dataset: 'fixed in <versions>' (193,926), 'affected'
 * (39,286), 'open' (1,347), 'under investigation' (1,098), '' (960),
 * 'needed' (27), 'deferred' (12).
 */
export function fixState(fixStatus: string): FixState {
  if (fixStatus.startsWith('fixed in')) return 'available';
  if (fixStatus === 'fixed') return 'fixed';
  return 'none';
}

export const fixStateLabel: Record<FixState, string> = {
  available: 'Fix Available',
  fixed: 'Fixed',
  none: 'Needs Patch',
};

export const fixStateClass: Record<FixState, string> = {
  available: 'text-accent',
  fixed: 'text-resolved',
  none: 'text-critical',
};

/**
 * Whitespace escapes that lost their backslash somewhere upstream.
 *
 * The advisory text in `ui_demo.json` contains the literal characters `u00a0`
 * where a non-breaking space was meant — 1,438 occurrences in the source, so
 * this happened before the data reached us and `build-data.js` copies the
 * field through verbatim. Every code point listed here is a whitespace
 * character, which is why substituting a plain space is safe: there is no
 * reading where "Builderu00a0to" was intended.
 *
 * Deliberately narrow. A general `/u[0-9a-f]{4}/` sweep would also eat real
 * words — `uccee` appears seven times in this dataset and is not an escape.
 */
const MANGLED_WHITESPACE = /u00a0|u0020|u2028|u2029/g;

/**
 * Makes advisory text safe to render: the broken escapes become spaces, and
 * the runs of whitespace they leave behind collapse to one.
 */
export function cleanAdvisoryText(text: string): string {
  if (!text) return '';
  return text.replace(MANGLED_WHITESPACE, ' ').replace(/\s+/g, ' ').trim();
}

export const capitalizeFirstLetter = (str: string) => {
  if (!str) return ''; // Handle empty strings
  return str.charAt(0).toUpperCase() + str.slice(1);
};
