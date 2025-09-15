// src/store/ammFactorySlice.js
import { createSlice } from '@reduxjs/toolkit';

const AMMFactorySlice = createSlice({
  name: 'AMMFactory',
  initialState: {
    contract: null, // will store ethers.Contract instance
  },
  reducers: {
    setAMMFactoryContract(state, action) {
      state.contract = action.payload;
    },
  },
});

export const { setAMMFactoryContract } = AMMFactorySlice.actions;

export default AMMFactorySlice.reducer;
