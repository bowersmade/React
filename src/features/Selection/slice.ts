import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SelectionState } from './types';

const initialState: SelectionState = {
  ids: [],
};

const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    /** One row's checkbox. */
    toggleSelected(state, action: PayloadAction<number>) {
      const index = state.ids.indexOf(action.payload);
      if (index === -1) {
        state.ids.push(action.payload);
      } else {
        state.ids.splice(index, 1);
      }
    },

    /**
     * Select-all over the current filter, which can be six figures of ids.
     *
     * Both bulk reducers replace `state.ids` outright rather than mutating it
     * element by element. Immer tracks every write to a draft, so 200k pushes
     * means 200k proxy traps; building the result first and assigning once
     * costs a single trap.
     */
    addSelected(state, action: PayloadAction<number[]>) {
      const next = new Set(state.ids);
      for (const id of action.payload) next.add(id);
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
