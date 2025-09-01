import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for AMM operations
export const fetchAMMPools = createAsyncThunk(
  'amm/fetchPools',
  async (_, { rejectWithValue }) => {
    try {
      // This will be implemented in the contract hooks
      return [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPoolData = createAsyncThunk(
  'amm/fetchPoolData',
  async (poolAddress, { rejectWithValue }) => {
    try {
      // This will be implemented in the contract hooks
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const ammSlice = createSlice({
  name: 'amm',
  initialState: {
    pools: {
      data: [], // Array of pool objects
      loading: false,
      error: null,
    },
    selectedPool: {
      data: null,
      loading: false,
      error: null,
    },
    userPositions: {
      data: [], // User's liquidity positions
      loading: false,
      error: null,
    },
    tokenBalances: {
      usdc: '0',
      fractions: {}, // watchId -> balance
      loading: false,
      error: null,
    },
    swapQuotes: {
      usdcToFraction: null,
      fractionToUsdc: null,
      loading: false,
      error: null,
    },
    transactions: {
      pending: [],
      completed: [],
    },
  },
  reducers: {
    setPools: (state, action) => {
      state.pools.data = action.payload;
      state.pools.loading = false;
      state.pools.error = null;
    },
    setSelectedPool: (state, action) => {
      state.selectedPool.data = action.payload;
      state.selectedPool.loading = false;
      state.selectedPool.error = null;
    },
    updatePoolData: (state, action) => {
      const { poolAddress, updates } = action.payload;
      const poolIndex = state.pools.data.findIndex(pool => pool.address === poolAddress);
      if (poolIndex !== -1) {
        state.pools.data[poolIndex] = { ...state.pools.data[poolIndex], ...updates };
      }
    },
    setUserPositions: (state, action) => {
      state.userPositions.data = action.payload;
      state.userPositions.loading = false;
      state.userPositions.error = null;
    },
    updateUserPosition: (state, action) => {
      const { poolAddress, updates } = action.payload;
      const positionIndex = state.userPositions.data.findIndex(pos => pos.poolAddress === poolAddress);
      if (positionIndex !== -1) {
        state.userPositions.data[positionIndex] = { ...state.userPositions.data[positionIndex], ...updates };
      } else {
        state.userPositions.data.push({ poolAddress, ...updates });
      }
    },
    setTokenBalances: (state, action) => {
      state.tokenBalances = { ...state.tokenBalances, ...action.payload };
      state.tokenBalances.loading = false;
      state.tokenBalances.error = null;
    },
    updateTokenBalance: (state, action) => {
      const { token, balance } = action.payload;
      if (token === 'usdc') {
        state.tokenBalances.usdc = balance;
      } else {
        state.tokenBalances.fractions[token] = balance;
      }
    },
    setSwapQuotes: (state, action) => {
      state.swapQuotes = { ...state.swapQuotes, ...action.payload };
      state.swapQuotes.loading = false;
      state.swapQuotes.error = null;
    },
    addPendingTransaction: (state, action) => {
      state.transactions.pending.push(action.payload);
    },
    completePendingTransaction: (state, action) => {
      const txHash = action.payload;
      const pendingIndex = state.transactions.pending.findIndex(tx => tx.hash === txHash);
      if (pendingIndex !== -1) {
        const tx = state.transactions.pending.splice(pendingIndex, 1)[0];
        state.transactions.completed.push(tx);
      }
    },
    setLoading: (state, action) => {
      const { section, loading } = action.payload;
      if (state[section]) {
        state[section].loading = loading;
      }
    },
    setError: (state, action) => {
      const { section, error } = action.payload;
      if (state[section]) {
        state[section].error = error;
        state[section].loading = false;
      }
    },
    clearError: (state, action) => {
      const section = action.payload;
      if (state[section]) {
        state[section].error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAMMPools.pending, (state) => {
        state.pools.loading = true;
        state.pools.error = null;
      })
      .addCase(fetchAMMPools.fulfilled, (state, action) => {
        state.pools.loading = false;
        state.pools.data = action.payload;
      })
      .addCase(fetchAMMPools.rejected, (state, action) => {
        state.pools.loading = false;
        state.pools.error = action.payload;
      });
  },
});

export const {
  setPools,
  setSelectedPool,
  updatePoolData,
  setUserPositions,
  updateUserPosition,
  setTokenBalances,
  updateTokenBalance,
  setSwapQuotes,
  addPendingTransaction,
  completePendingTransaction,
  setLoading,
  setError,
  clearError,
} = ammSlice.actions;

export default ammSlice.reducer;