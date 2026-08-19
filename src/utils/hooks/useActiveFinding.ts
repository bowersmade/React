import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Vulnerability } from '../types/data';

const PARAM = 'finding';

/**
 * The finding whose detail drawer is open, mirrored into the URL.
 *
 * In the URL rather than component state for two reasons. An open finding
 * becomes linkable — the thing you paste into a ticket — and it gives the
 * command palette somewhere to aim: opening a finding from anywhere in the app
 * is then a navigation, not a message that has to be threaded through a page
 * that may not be mounted yet.
 *
 * Kept apart from `useFilters` deliberately. Every write there runs inside a
 * transition because it triggers a re-filter of 236k rows; opening a drawer
 * triggers nothing of the sort and should not queue behind that work. Both use
 * the functional form of `setSearchParams`, so neither clobbers the other's
 * params.
 */
export function useActiveFinding(data: Vulnerability[]) {
  const [params, setParams] = useSearchParams();
  const raw = params.get(PARAM);

  /**
   * `id` is the record's position in the decoded array, so this is one index
   * lookup. The identity check matters more here than elsewhere — the value
   * came from a URL somebody may have edited, so it is untrusted input, and a
   * stale or hand-typed id resolves to nothing rather than to a random finding.
   */
  const finding = useMemo(() => {
    if (raw === null) return null;

    const id = Number(raw);
    if (!Number.isInteger(id) || id < 0) return null;

    const candidate = data[id];
    return candidate && candidate.id === id ? candidate : null;
  }, [raw, data]);

  const setFinding = useCallback(
    (next: Vulnerability | null) => {
      setParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next) params.set(PARAM, String(next.id));
          else params.delete(PARAM);
          return params;
        },
        // Opening and closing a drawer should not stack up history entries —
        // Back ought to leave the page, not walk back through everything the
        // user glanced at.
        { replace: true }
      );
    },
    [setParams]
  );

  return { finding, setFinding };
}
