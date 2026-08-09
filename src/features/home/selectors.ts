import { RootState } from '../../store/store';

export const selectAllNotes = (state: RootState) => state.home.notes;
