// src/store/fractionalizerFactorySlice.js
import { createSlice } from '@reduxjs/toolkit';

const fractionalizerFactorySlice = createSlice({
  name: 'fractionalizerFactory',
  initialState: {
    contract: null, // will store ethers.Contract instance
  },
  reducers: {
    setFractionalizerFactoryContract(state, action) {
      state.contract = action.payload;
    },
  },
});

export const { setFractionalizerFactoryContract } = fractionalizerFactorySlice.actions;

export default fractionalizerFactorySlice.reducer;
