import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

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
type FlagKey = 'hideManuallyCleared' | 'hideAiCleared';

export function useFilters() {
  const [params, setParams] = useSearchParams();

  const group = params.get('group');
  const repo = params.get('repo');
  const hideManuallyCleared = params.has('hideManuallyCleared');
  const hideAiCleared = params.has('hideAiCleared');

  const write = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: false }
      );
    },
    [setParams]
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

  /**
   * Clears all filters
   */
  const clearFilters = useCallback(() => {
    write((next) => {
      next.delete('group');
      next.delete('repo');
      next.delete('hideManuallyCleared');
      next.delete('hideAiCleared');
    });
  }, [write]);

  return useMemo(
    () => ({
      group,
      repo,
      hideManuallyCleared,
      hideAiCleared,
      setFilter,
      toggleFilter,
      clearFilters,
    }),
    [group, repo, hideManuallyCleared, hideAiCleared, setFilter, toggleFilter, clearFilters]
  );
}
