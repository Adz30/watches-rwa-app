// src/store/fractionalizerSlice.js
import { createSlice } from '@reduxjs/toolkit';

const fractionalizerSlice = createSlice({
  name: 'fractionalizer',
  initialState: {
    contract: null, // will store ethers.Contract instance
  },
  reducers: {
    setFractionalizerContract(state, action) {
      state.contract = action.payload;
    },
  },
});

export const { setFractionalizerContract } = fractionalizerSlice.actions;
export default fractionalizerSlice.reducer;
