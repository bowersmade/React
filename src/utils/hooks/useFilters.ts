import { useCallback, useMemo, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SeverityKey } from '../types/data';
import type { FilterModalValue } from '../../components/organisms/filter-modal/filter-modal';

/**
 * Filter state lives in the URL rather than in React state.
 *
 * That makes a filtered view shareable and survivable: paste the address to a
 * colleague and they see the same findings, and a refresh does not throw the
 * investigation away. The cost is that everything arrives as a string, so this
 * hook owns the translation and nothing else in the app touches
 * `URLSearchParams` directly.
 */

/** Filters that hold a value. Absent key means "no filter". */
type ScopeKey = 'group' | 'repo';

/** Filters that are on or off. Presence of the key is the value. */
export type FlagKey = 'hideManuallyCleared' | 'hideAiCleared' | 'hideUnreviewed';

export function useFilters() {
  const [params, setParams] = useSearchParams();
  // Every write goes through `write()` below, wrapped in a transition. That
  // marks the resulting re-render (which recomputes `filterData` over up to
  // 236k rows) as low priority and, critically, tells React it must not block
  // any OTHER, unrelated state update — like the filter modal's own
  // `isFilterModalOpen` closing — that happens in the same click handler.
  // Without this, closing the modal and re-filtering the table were coupled:
  // the modal would stay visibly open until the heavy recompute finished.
  const [isApplyingFilters, startTransition] = useTransition();

  const group = params.get('group');
  const repo = params.get('repo');
  /**
   *  This grabs the filters and then memoizes them to prevent rerenders from happening
   * */
  const severityKey = params.getAll('severities').join(',');
  const severities = useMemo(
    () => (severityKey ? (severityKey.split(',') as SeverityKey[]) : []),
    [severityKey]
  );
  const hideUnreviewed = params.has('hideUnreviewed');
  const hideManuallyCleared = params.has('hideManuallyCleared');
  const hideAiCleared = params.has('hideAiCleared');
  const from = params.get('from');
  const to = params.get('to');

  const write = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      startTransition(() => {
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            mutate(next);
            return next;
          },
          { replace: false }
        );
      });
    },
    [setParams, startTransition]
  );

  /**
   * Switches filter values that aren't boolean
   */
  const setFilter = useCallback(
    (key: ScopeKey, value: string | null) => {
      write((next) => {
        if (value) {
          if (key === 'group' && next.has('repo')) {
            next.delete('repo');
          }
          next.set(key, value);
        } else {
          next.delete(key);
        }
      });
    },
    [write]
  );

  /**
   * Switches filters with boolean values
   */
  const toggleFilter = useCallback(
    (key: FlagKey) => {
      write((next) => {
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.set(key, '1');
        }
      });
    },
    [write]
  );

  const setSeverities = useCallback(
    (key: SeverityKey[]) => {
      write((next) => {
        next.delete('severities');

        for (let sev of key) {
          next.append('severities', sev);
        }
      });
    },
    [write]
  );

  const setDateRange = useCallback(
    (nextFrom: string | null, nextTo: string | null) => {
      write((next) => {
        if (nextFrom) next.set('from', nextFrom);
        else next.delete('from');
        if (nextTo) next.set('to', nextTo);
        else next.delete('to');
      });
    },
    [write]
  );

  /**
   * Commits every field the filter modal owns in one shot.
   *
   * `setSeverities`, `setDateRange`, and `toggleFilter` each call `write()`
   * independently, and `write()` goes through React Router's `setSearchParams`.
   * That function is NOT like React's `setState` — it doesn't thread a live
   * "previous" value across multiple synchronous calls, it closes over the
   * `searchParams` from the current render. So calling it several times in a
   * row (like the modal's Apply button used to) makes every call mutate from
   * the same stale base, and only the last call's result survives — the
   * earlier ones get silently clobbered. Doing every field in a single
   * `write()` call avoids that entirely.
   */
  const applyModalFilters = useCallback(
    (value: FilterModalValue) => {
      write((next) => {
        next.delete('severities');
        for (const sev of value.severities) {
          next.append('severities', sev);
        }

        if (value.from) next.set('from', value.from);
        else next.delete('from');
        if (value.to) next.set('to', value.to);
        else next.delete('to');

        if (value.hideUnreviewed) next.set('hideUnreviewed', '1');
        else next.delete('hideUnreviewed');
        if (value.hideManuallyCleared) next.set('hideManuallyCleared', '1');
        else next.delete('hideManuallyCleared');
        if (value.hideAiCleared) next.set('hideAiCleared', '1');
        else next.delete('hideAiCleared');
      });
    },
    [write]
  );

  /**
   * Clears all filters
   */
  const clearFilters = useCallback(() => {
    write((next) => {
      next.delete('group');
      next.delete('repo');
      next.delete('hideManuallyCleared');
      next.delete('hideAiCleared');
      next.delete('hideUnreviewed');
      next.delete('severities');
      next.delete('from');
      next.delete('to');
    });
  }, [write]);

  return useMemo(
    () => ({
      group,
      repo,
      severities,
      hideUnreviewed,
      hideManuallyCleared,
      hideAiCleared,
      from,
      to,
      setSeverities,
      setDateRange,
      setFilter,
      toggleFilter,
      applyModalFilters,
      clearFilters,
      isApplyingFilters,
    }),
    [
      group,
      repo,
      severities,
      hideUnreviewed,
      hideManuallyCleared,
      hideAiCleared,
      from,
      to,
      setSeverities,
      setDateRange,
      setFilter,
      toggleFilter,
      applyModalFilters,
      clearFilters,
      isApplyingFilters,
    ]
  );
}
