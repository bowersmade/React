import { configureStore } from '@reduxjs/toolkit';
import { homeReducer, homeKey } from '../features/home/slice';

export const store = configureStore({
  reducer: {
    [homeKey]: homeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
