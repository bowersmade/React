import { useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectSelectedIds } from '../../features/Selection/selectors';
import { MAX_COMPARABLE } from '../../features/Selection/slice';
import { useVulnerabilities } from '../../context/vulnerabilitiesContext';
import type { Vulnerability } from '../types/data';

/**
 * The ticked rows, as findings rather than ids.
 *
 * `id` is the record's position in the decoded array — the loader assigns it
 * that way — so each selection is one index lookup rather than a scan of 236k
 * rows. The identity check keeps that assumption honest: if it ever stops
 * holding, the row is skipped rather than resolving to the wrong CVE.
 *
 * Capped defensively even though the slice already caps writes, because the two
 * screens that read this both scale with the result — a column each on Compare,
 * a file row each on export — and neither should be at the mercy of state that
 * predates the cap.
 *
 * Returned in selection order rather than the table's sort order, matching what
 * the comparison screen shows. With at most `MAX_COMPARABLE` of them the
 * distinction is academic, but it means both consumers agree.
 */
export function useSelectedFindings(): Vulnerability[] {
  const { data: vulnerabilites } = useVulnerabilities();
  const selectedIds = useAppSelector(selectSelectedIds);

  return useMemo(() => {
    const resolved: Vulnerability[] = [];

    for (const id of selectedIds) {
      if (resolved.length >= MAX_COMPARABLE) break;

      const candidate = vulnerabilites[id];
      if (candidate && candidate.id === id) resolved.push(candidate);
    }

    return resolved;
  }, [selectedIds, vulnerabilites]);
}
