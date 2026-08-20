import { useCallback, useMemo, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SeverityKey } from '../types/data';
import type { FilterModalValue } from '../../components/organisms/filter-modal/filter-modal';
import type { AppliedFilter } from '../../components/molecules/filter-bar/filter-bar';
import { capitalizeFirstLetter } from '../helpers/format';

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

        for (const sev of key) {
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

  /**
   * The active filters described as the chips `FilterBar` renders.
   *
   * This lives here rather than on a page because more than one screen shows
   * the same bar, and — more importantly — the `id` a chip carries is the same
   * string `removeFilter` below switches on. Keeping the two next to each other
   * is what stops a new filter growing a chip that nothing can clear.
   *
   * Group and repo are deliberately absent. They are set from the dashboard's
   * scope pickers, which already display their own state, so a chip would be a
   * second control claiming to own the same value.
   */
  const appliedFilters = useMemo<AppliedFilter[]>(() => {
    const applied: AppliedFilter[] = [];

    if (hideManuallyCleared) {
      applied.push({ id: 'hideManuallyCleared', label: 'Hiding', value: 'Manual Dismissed' });
    }
    if (hideAiCleared) {
      applied.push({ id: 'hideAiCleared', label: 'Hiding', value: 'AI Dismissed' });
    }
    if (hideUnreviewed) {
      applied.push({ id: 'hideUnreviewed', label: 'Hiding', value: 'Unreviewed' });
    }

    for (const severity of severities) {
      applied.push({ id: severity, label: 'Severity', value: capitalizeFirstLetter(severity) });
    }

    if (from) applied.push({ id: 'from', label: 'Showing', value: `${from} and Above` });
    if (to) applied.push({ id: 'to', label: 'Showing', value: `${to} and Below` });

    return applied;
  }, [from, hideAiCleared, hideManuallyCleared, hideUnreviewed, severities, to]);

  /**
   * Clears whichever filter a chip stands for. Anything not recognised as a
   * flag, a scope or a date is a severity, which is the only id drawn from the
   * value itself rather than a fixed key.
   */
  const removeFilter = useCallback(
    (id: string) => {
      if (id === 'hideManuallyCleared' || id === 'hideAiCleared' || id === 'hideUnreviewed') {
        toggleFilter(id);
      } else if (id === 'group' || id === 'repo') {
        setFilter(id, null);
      } else if (id === 'from') {
        setDateRange(null, to);
      } else if (id === 'to') {
        setDateRange(from, null);
      } else {
        setSeverities(severities.filter((s) => s !== id));
      }
    },
    [from, to, severities, toggleFilter, setFilter, setDateRange, setSeverities]
  );

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
      appliedFilters,
      removeFilter,
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
      appliedFilters,
      removeFilter,
      isApplyingFilters,
    ]
  );
}
