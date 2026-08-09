import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HomeSlice } from './types';
import { Note } from '../../utils/types';

export const initialState: HomeSlice = {
  notes: [],
};

export const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    addNote: (state, action: PayloadAction<Note>) => {
      state.notes = [...state.notes, action.payload];
    },
    deleteNote: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      state.notes = state.notes.filter(({ id: ident }) => ident !== id);
    },
    updateNote: (state, action: PayloadAction<Note>) => {
      const { title, body, id } = action.payload;

      state.notes = state.notes.map((note) => {
        if (note.id === action.payload.id) {
          return {
            title: title,
            body: body,
            id: id,
          };
        }

        return note;
      });
    },
  },
});

export const { addNote, updateNote, deleteNote } = homeSlice.actions;
export const homeReducer = homeSlice.reducer;
export const homeKey = homeSlice.name;
