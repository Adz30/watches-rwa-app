// src/store/oracleSlice.js
import { createSlice } from "@reduxjs/toolkit";

const oracleSlice = createSlice({
  name: "oracle",
  initialState: {
    contract: null,      // ethers.Contract instance
    prices: {},          // tokenId -> price mapping
    loading: false,
    error: null,
  },
  reducers: {
    setOracleContract(state, action) {
      state.contract = action.payload;
    },
    setOraclePrice(state, action) {
      const { tokenId, price } = action.payload;
      state.prices[tokenId] = price;
    },
    setOracleLoading(state, action) {
      state.loading = action.payload;
    },
    setOracleError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  setOracleContract,
  setOraclePrice,
  setOracleLoading,
  setOracleError,
} = oracleSlice.actions;

export default oracleSlice.reducer;
