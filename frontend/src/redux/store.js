// frontend/src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';

import tokensReducer from './reducers/tokenSlice';
import watchNftReducer from './reducers/watchNftSlice';
import ammReducer from './reducers/ammSlice';
import lendingReducer from './reducers/lendingSlice';
import oracleReducer from './reducers/oracleSlice';
import fractionalizerFactoryReducer from './reducers/fractionalizerFactorySlice';
import fractionalizerReducer from './reducers/fractionalizerSlice';
import watchFractionReducer from './reducers/watchFractionSlice';

import providerReducer from './reducers/providerSlice';


export const store = configureStore({
  reducer: {
    tokens: tokensReducer,
    watchNft: watchNftReducer,
    amm: ammReducer,
    lending: lendingReducer,
    oracle: oracleReducer,
    watchFraction: watchFractionReducer,
    fractionalizerFactory: fractionalizerFactoryReducer,
    fractionalizer: fractionalizerReducer,
    provider: providerReducer,
    // add ammSlice, nftSlice, lendingSlice here later
  },

  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});
