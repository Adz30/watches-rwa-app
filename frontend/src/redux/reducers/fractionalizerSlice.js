// src/store/fractionalizerSlice.js
import { createSlice } from '@reduxjs/toolkit';

const fractionalizerSlice = createSlice({
  name: 'fractionalizer',
  initialState: {
    contract: null,
    nftId: null,
    fractionAddress: null,
    totalSupply: null,
    balance: null,
    status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
    error: null,    // store error message
  },
  reducers: {
    setFractionalizerContract(state, action) {
      state.contract = action.payload.contract;
      state.nftId = action.payload.nftId;
      state.status = 'idle';
      state.error = null;
    },
    setFractionalTokenData(state, action) {
      const { fractionAddress, totalSupply, balance } = action.payload;
      state.fractionAddress = fractionAddress;
      state.totalSupply = totalSupply;
      state.balance = balance;
      state.status = 'success';
      state.error = null;
    },
    setStatus(state, action) {
      state.status = action.payload;
    },
    setFractionalizerError(state, action) {
      state.status = 'error';
      state.error = action.payload;
    },
    resetFractionalizer(state) {
      state.contract = null;
      state.nftId = null;
      state.fractionAddress = null;
      state.totalSupply = null;
      state.balance = null;
      state.status = 'idle';
      state.error = null;
    },
  },
});

export const { setFractionalizerContract, setFractionalTokenData, setStatus, setFractionalizerError, resetFractionalizer } =
  fractionalizerSlice.actions;

export default fractionalizerSlice.reducer;
