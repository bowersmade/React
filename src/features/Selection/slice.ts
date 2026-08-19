import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SelectionState } from './types';

/**
 * Hard ceiling on the selection.
 *
 * The selection exists to feed the comparison screen, and that screen renders a
 * column per finding — so an uncapped selection means an uncapped number of
 * columns. Selecting every row on the list (236,656 of them) and hitting
 * Compare asked the browser for a quarter of a million columns and took the tab
 * with it.
 *
 * Enforced here in the reducers rather than only in the UI, so no caller can
 * route around it: a stray dispatch, a future bulk action, or rehydrated state
 * all land on the same limit. Ten is well past what anyone can read side by
 * side and still far enough from the cliff to be safe.
 */
export const MAX_COMPARABLE = 10;

const initialState: SelectionState = {
  ids: [],
};

const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    /** One row's checkbox. Deselecting always works; selecting stops at the cap. */
    toggleSelected(state, action: PayloadAction<number>) {
      const index = state.ids.indexOf(action.payload);

      if (index !== -1) {
        state.ids.splice(index, 1);
        return;
      }

      if (state.ids.length >= MAX_COMPARABLE) return;
      state.ids.push(action.payload);
    },

    /**
     * Bulk select, filling only up to the remaining capacity — passing more ids
     * than the cap takes the first of them rather than being rejected outright.
     *
     * Replaces `state.ids` in one assignment rather than pushing element by
     * element: Immer traps every write to a draft, so the loop matters even at
     * these sizes and mattered a great deal before the cap existed.
     */
    addSelected(state, action: PayloadAction<number[]>) {
      const next = new Set(state.ids);

      for (const id of action.payload) {
        if (next.size >= MAX_COMPARABLE) break;
        next.add(id);
      }

      state.ids = Array.from(next);
    },

    removeSelected(state, action: PayloadAction<number[]>) {
      const dropping = new Set(action.payload);
      state.ids = state.ids.filter((id) => !dropping.has(id));
    },

    clearSelection(state) {
      state.ids = [];
    },
  },
});

export const { toggleSelected, addSelected, removeSelected, clearSelection } =
  selectionSlice.actions;
export const selectionReducer = selectionSlice.reducer;
export const selectionKey = selectionSlice.name;
