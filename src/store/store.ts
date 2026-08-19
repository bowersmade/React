import { configureStore } from '@reduxjs/toolkit';

import { selectionKey, selectionReducer } from '../features/Selection/slice';

export const store = configureStore({
  reducer: {
    [selectionKey]: selectionReducer,
  },
  devTools: !import.meta.env.PROD,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
