import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for lending operations
export const fetchPoolInfo = createAsyncThunk(
  'lending/fetchPoolInfo',
  async (_, { rejectWithValue }) => {
    try {
      // This will be implemented in the contract hooks
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchLenderInfo = createAsyncThunk(
  'lending/fetchLenderInfo',
  async (address, { rejectWithValue }) => {
    try {
      // This will be implemented in the contract hooks
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserLoans = createAsyncThunk(
  'lending/fetchUserLoans',
  async (address, { rejectWithValue }) => {
    try {
      // This will be implemented in the contract hooks
      return [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const lendingSlice = createSlice({
  name: 'lending',
  initialState: {
    poolInfo: {
      totalPoolUSDC: '0',
      totalShares: '0',
      loading: false,
      error: null,
    },
    lenderInfo: {
      shares: '0',
      usdcValue: '0',
      loading: false,
      error: null,
    },
    loans: {
      active: [],
      repaid: [],
      loading: false,
      error: null,
    },
    transactions: {
      pending: [],
      completed: [],
    },
  },
  reducers: {
    setPoolInfo: (state, action) => {
      state.poolInfo = { ...state.poolInfo, ...action.payload };
    },
    setLenderInfo: (state, action) => {
      state.lenderInfo = { ...state.lenderInfo, ...action.payload };
    },
    addLoan: (state, action) => {
      state.loans.active.push(action.payload);
    },
    updateLoan: (state, action) => {
      const { nftId, updates } = action.payload;
      const loanIndex = state.loans.active.findIndex(loan => loan.nftId === nftId);
      if (loanIndex !== -1) {
        state.loans.active[loanIndex] = { ...state.loans.active[loanIndex], ...updates };
      }
    },
    repayLoan: (state, action) => {
      const nftId = action.payload;
      const loanIndex = state.loans.active.findIndex(loan => loan.nftId === nftId);
      if (loanIndex !== -1) {
        const loan = state.loans.active.splice(loanIndex, 1)[0];
        state.loans.repaid.push({ ...loan, repaid: true });
      }
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
    clearError: (state, action) => {
      const section = action.payload;
      if (state[section]) {
        state[section].error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPoolInfo.pending, (state) => {
        state.poolInfo.loading = true;
        state.poolInfo.error = null;
      })
      .addCase(fetchPoolInfo.fulfilled, (state, action) => {
        state.poolInfo.loading = false;
        state.poolInfo = { ...state.poolInfo, ...action.payload };
      })
      .addCase(fetchPoolInfo.rejected, (state, action) => {
        state.poolInfo.loading = false;
        state.poolInfo.error = action.payload;
      })
      .addCase(fetchLenderInfo.pending, (state) => {
        state.lenderInfo.loading = true;
        state.lenderInfo.error = null;
      })
      .addCase(fetchLenderInfo.fulfilled, (state, action) => {
        state.lenderInfo.loading = false;
        state.lenderInfo = { ...state.lenderInfo, ...action.payload };
      })
      .addCase(fetchLenderInfo.rejected, (state, action) => {
        state.lenderInfo.loading = false;
        state.lenderInfo.error = action.payload;
      });
  },
});

export const {
  setPoolInfo,
  setLenderInfo,
  addLoan,
  updateLoan,
  repayLoan,
  addPendingTransaction,
  completePendingTransaction,
  clearError,
} = lendingSlice.actions;

export default lendingSlice.reducer;