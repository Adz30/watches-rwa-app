import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tokens: {}, // { [nftId]: { contract, fractionAddress, totalSupply, balance, status, error } }
  globalStatus: "idle", // optional overall UI status
};

const watchFractionSlice = createSlice({
  name: "watchFraction",
  initialState,
  reducers: {
    // Set or update fractional token data for a specific NFT
    setFractionalTokenData: (state, action) => {
      const { nftId, fractionAddress, contract, totalSupply, balance, name, symbol, decimals } = action.payload;
      state.tokens[nftId] = {
        ...(state.tokens[nftId] || {}),
        fractionAddress,
        contract,
        totalSupply,
        balance,
        name,
        symbol,
        decimals,
        status: "success",
        error: null,
      };
    },

    // Set per-NFT status (loading, success, etc.)
    setFractionStatus: (state, action) => {
      const { nftId, status } = action.payload;
      if (!state.tokens[nftId]) state.tokens[nftId] = {};
      state.tokens[nftId].status = status;
    },

    // Set per-NFT error
    setFractionError: (state, action) => {
      const { nftId, error } = action.payload;
      if (!state.tokens[nftId]) state.tokens[nftId] = {};
      state.tokens[nftId].status = "error";
      state.tokens[nftId].error = error;
    },

    // Clear a single NFT’s data
    clearFractionDataById: (state, action) => {
      const nftId = action.payload;
      delete state.tokens[nftId];
    },

    // Clear all fractional data (reset slice)
    clearAllFractionData: (state) => {
      state.tokens = {};
      state.globalStatus = "idle";
    },

    // Optional: set global status
    setGlobalStatus: (state, action) => {
      state.globalStatus = action.payload;
    },
  },
});

export const {
  setFractionalTokenData,
  setFractionStatus,
  setFractionError,
  clearFractionDataById,
  clearAllFractionData,
  setGlobalStatus,
} = watchFractionSlice.actions;

export default watchFractionSlice.reducer;
