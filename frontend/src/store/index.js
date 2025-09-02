import { configureStore } from '@reduxjs/toolkit';
import lendingReducer from './slices/lendingSlice';
import ammReducer from './slices/ammSlice';
import nftReducer from './slices/nftSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    lending: lendingReducer,
    amm: ammReducer,
    nft: nftReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});