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

  // `get` returns `string | null` and `has` returns a boolean, so both read
  // straight into the shapes `applyFilters` wants. No parsing.
  const group = params.get('group');
  const repo = params.get('repo');
  const hideManuallyCleared = params.has('hideManuallyCleared');
  const hideAiCleared = params.has('hideAiCleared');

  /**
   * The one place that writes to the query string.
   *
   * `setParams` replaces the whole thing, so every write starts from `prev` —
   * otherwise changing one filter would silently drop the other three. Taking
   * `prev` from the updater rather than reading `params` from this render means
   * two writes in the same handler cannot clobber each other.
   */
  const write = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        // Choosing a scope or flipping a toggle is a deliberate action worth
        // undoing, so each gets a history entry. A search box would want
        // { replace: true } instead, or every keystroke becomes a back press.
        { replace: false }
      );
    },
    [setParams]
  );

  /**
   * Sets a scope filter, or clears it when `value` is null.
   *
   * Clearing deletes the key rather than setting it empty: `?group=` reads back
   * as '', which would filter for a group whose name is the empty string.
   */
  const setFilter = useCallback(
    (key: ScopeKey, value: string | null) => {
      write((next) => {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      });
    },
    [write]
  );

  /** Flips a flag. Present means on, so toggling an active filter removes it. */
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

  /** Drops every filter at once, leaving any unrelated params alone. */
  const clearFilters = useCallback(() => {
    write((next) => {
      next.delete('group');
      next.delete('repo');
      next.delete('hideManuallyCleared');
      next.delete('hideAiCleared');
    });
  }, [write]);

  // Consumers feed this into useMemo deps with an expensive filter pass hanging
  // off it, so the identity has to survive renders where nothing changed.
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
