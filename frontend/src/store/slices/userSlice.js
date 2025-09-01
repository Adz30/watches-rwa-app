import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    address: null,
    isConnected: false,
    chainId: null,
    balances: {
      eth: '0',
      usdc: '0',
      fractionTokens: {}, // tokenAddress -> balance
    },
    transactions: {
      pending: [],
      completed: [],
      failed: [],
    },
    preferences: {
      slippageTolerance: '0.5', // percentage
      gasPrice: 'standard',
    },
  },
  reducers: {
    setUserInfo: (state, action) => {
      const { address, isConnected, chainId } = action.payload;
      state.address = address;
      state.isConnected = isConnected;
      state.chainId = chainId;
    },
    setBalances: (state, action) => {
      state.balances = { ...state.balances, ...action.payload };
    },
    updateBalance: (state, action) => {
      const { token, balance } = action.payload;
      if (token === 'eth' || token === 'usdc') {
        state.balances[token] = balance;
      } else {
        state.balances.fractionTokens[token] = balance;
      }
    },
    addTransaction: (state, action) => {
      const { hash, type, status, data } = action.payload;
      const transaction = {
        hash,
        type,
        status,
        data,
        timestamp: Date.now(),
      };
      
      if (status === 'pending') {
        state.transactions.pending.push(transaction);
      } else if (status === 'completed') {
        state.transactions.completed.push(transaction);
      } else if (status === 'failed') {
        state.transactions.failed.push(transaction);
      }
    },
    updateTransaction: (state, action) => {
      const { hash, status, receipt } = action.payload;
      
      // Find transaction in pending array
      const pendingIndex = state.transactions.pending.findIndex(tx => tx.hash === hash);
      if (pendingIndex !== -1) {
        const transaction = state.transactions.pending.splice(pendingIndex, 1)[0];
        transaction.status = status;
        transaction.receipt = receipt;
        
        if (status === 'completed') {
          state.transactions.completed.push(transaction);
        } else if (status === 'failed') {
          state.transactions.failed.push(transaction);
        }
      }
    },
    setPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    clearTransactions: (state, action) => {
      const type = action.payload; // 'pending', 'completed', 'failed', or 'all'
      if (type === 'all') {
        state.transactions.pending = [];
        state.transactions.completed = [];
        state.transactions.failed = [];
      } else {
        state.transactions[type] = [];
      }
    },
  },
});

export const {
  setUserInfo,
  setBalances,
  updateBalance,
  addTransaction,
  updateTransaction,
  setPreferences,
  clearTransactions,
} = userSlice.actions;

export default userSlice.reducer;