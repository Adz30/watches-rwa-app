// frontend/src/redux/reducers/ammFactorySlice.js
import { createSlice } from "@reduxjs/toolkit";

// --------------------
// SLICE
// --------------------
const ammSlice = createSlice({
  name: "amm",
  initialState: {
    ammFactoryContract: null,
    poolContracts: {}, // fractionAddress -> contract
    pools: {}, // poolAddress -> { fractionBalance, usdcBalance, totalShares, sharesByUser, feeBps, loading, error }
    deploying: {}, // fractionAddress -> bool
    deployErrors: {}, // fractionAddress -> error message
  },
  reducers: {
    setAmmFactoryContract: (state, action) => {
      state.ammFactoryContract = action.payload;
    },

    setPoolContract: (state, action) => {
      const { fractionAddress, poolContract } = action.payload;
      state.poolContracts[fractionAddress] = poolContract;
    },

    setPoolError: (state, action) => {
      const { poolAddress, error } = action.payload;
      if (!state.pools[poolAddress]) state.pools[poolAddress] = {};
      state.pools[poolAddress].error = error;
    },

    setPoolData: (state, action) => {
      const { poolAddress, data } = action.payload;
      state.pools[poolAddress] = { ...state.pools[poolAddress], ...data };
    },

    setDeploying: (state, action) => {
      const { fractionAddress, status } = action.payload;
      state.deploying[fractionAddress] = status;
    },

    setDeployError: (state, action) => {
      const { fractionAddress, error } = action.payload;
      state.deployErrors[fractionAddress] = error;
    },
  },
});

export const {
  setAmmFactoryContract,
  setPoolContract,
  setPoolError,
  setPoolData,
  setDeploying,
  setDeployError,
} = ammSlice.actions;

export default ammSlice.reducer;
