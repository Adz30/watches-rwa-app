// src/store/ammFactorySlice.js
import { createSlice } from '@reduxjs/toolkit';

const AMMPoolSlice = createSlice({
  name: 'AMMPool',
  initialState: {
    contract: null, // will store ethers.Contract instance
  },
  reducers: {
    setAMMPoolContract(state, action) {
      state.contract = action.payload;
    },
  },
});

export const { setAMMPoolContract } = AMMPoolSlice.actions;

export default AMMPoolSlice.reducer;
