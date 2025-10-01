// src/store/fractionalizerFactorySlice.js
import { createSlice } from '@reduxjs/toolkit';

const fractionalizerFactorySlice = createSlice({
  name: 'fractionalizerFactory',
  initialState: {
    contract: null, // ethers.Contract instance
    fractionalizers: {}, // tokenId -> { fractionAddress, status, error }
    redeems: {},       // tokenId -> { status, error }
  },
  reducers: {
    // Set the factory contract instance
    setFactoryContract(state, action) {
      state.contract = action.payload;
    },

    // Fractionalizer reducers
    setFactoryStatus(state, action) {
      const { tokenId, status } = action.payload;
      if (!state.fractionalizers[tokenId]) state.fractionalizers[tokenId] = {};
      state.fractionalizers[tokenId].status = status;
    },

    setFactoryData(state, action) {
      const { tokenId, fractionAddress } = action.payload;
      if (!state.fractionalizers[tokenId]) state.fractionalizers[tokenId] = {};
      state.fractionalizers[tokenId].fractionAddress = fractionAddress;
    },

    setFactoryError(state, action) {
      const { tokenId, error } = action.payload;
      if (!state.fractionalizers[tokenId]) state.fractionalizers[tokenId] = {};
      state.fractionalizers[tokenId].error = error;
      state.fractionalizers[tokenId].status = 'error';
    },

    resetFactory(state, action) {
      const tokenId = action.payload;
      if (tokenId) {
        delete state.fractionalizers[tokenId];
      } else {
        state.fractionalizers = {};
      }
    },

    // Redeem reducers
    setRedeemStatus(state, action) {
      const { tokenId, status } = action.payload;
      if (!state.redeems[tokenId]) state.redeems[tokenId] = {};
      state.redeems[tokenId].status = status; // 'loading', 'success', 'error'
    },

    setRedeemError(state, action) {
      const { tokenId, error } = action.payload;
      if (!state.redeems[tokenId]) state.redeems[tokenId] = {};
      state.redeems[tokenId].status = 'error';
      state.redeems[tokenId].error = error;
    },

    resetRedeem(state, action) {
      const tokenId = action.payload;
      if (tokenId) {
        delete state.redeems[tokenId];
      } else {
        state.redeems = {};
      }
    },
  },
});

export const {
  setFactoryContract,
  setFactoryStatus,
  setFactoryData,
  setFactoryError,
  resetFactory,
  setRedeemStatus,
  setRedeemError,
  resetRedeem,
} = fractionalizerFactorySlice.actions;

export default fractionalizerFactorySlice.reducer;

// Selectors
export const selectFractionalizerFactoryContract = (state) =>
  state.fractionalizerFactory.contract;

export const selectFractionalizerByToken = (state, tokenId) =>
  state.fractionalizerFactory.fractionalizers[tokenId] || {};

export const selectRedeemByToken = (state, tokenId) =>
  state.fractionalizerFactory.redeems[tokenId] || {};
