import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';
import { MAX_COMPARABLE } from './slice';

export const selectSelectedIds = (state: RootState) => state.selection.ids;

export const selectSelectedCount = (state: RootState) => state.selection.ids.length;

/** At the cap — no further rows can be added until something is removed. */
export const selectIsSelectionFull = (state: RootState) =>
  state.selection.ids.length >= MAX_COMPARABLE;

/**
 * The same ids as a Set.
 *
 * The table asks "is this row selected" once per rendered row, so this has to
 * be a constant-time lookup rather than a scan. `createSelector` memoises on
 * the array's identity, so the Set is rebuilt only when the selection actually
 * changes — not on every render that happens to read it.
 */
export const selectSelectedIdSet = createSelector([selectSelectedIds], (ids) => new Set(ids));
