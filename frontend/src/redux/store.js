// frontend/src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';

import tokensReducer from './reducers/tokenSlice';
import watchNftReducer from './reducers/watchNftSlice';
import ammReducer from './reducers/ammFactorySlice';
import lendingReducer from './reducers/lendingSlice';
import oracleReducer from './reducers/oracleSlice';
import fractionalizerFactoryReducer from './reducers/fractionalizerFactorySlice';
import fractionalizerReducer from './reducers/fractionalizerSlice';
import ammPoolReducer from './reducers/ammPoolSlice';
import providerReducer from './reducers/providerSlice';


export const store = configureStore({
  reducer: {
    tokens: tokensReducer,
    watchNft: watchNftReducer,
    amm: ammReducer,
    lending: lendingReducer,
    oracle: oracleReducer,
    fractionalizerFactory: fractionalizerFactoryReducer,
    fractionalizer: fractionalizerReducer,
    ammPool: ammPoolReducer,
    provider: providerReducer,
    // add ammSlice, nftSlice, lendingSlice here later
  },

  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});
