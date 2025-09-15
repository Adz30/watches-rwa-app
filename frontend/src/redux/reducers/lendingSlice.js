// frontend/src/redux/reducers/lendingSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  contract: null,
  readOnlyContract: null,
  totalPoolUSDC: "0", // string for formatted numbers
  totalShares: "0", // string
  userShares: {
    // user's LP shares + equivalent USDC value
    shares: "0",
    usdcValue: "0",
  },
  loans: {}, // nftId => { borrower, borrowedAmount, repaid }
  loading: false,
  error: null,
  depositing: {
    isDepositing: false,
    isSuccess: false,
    transactionHash: null,
    error: null,
  },
  withdrawing: {
    isWithdrawing: false,
    isSuccess: false,
    transactionHash: null,
    error: null,
  },
};

const lendingSlice = createSlice({
  name: "lending",
  initialState,
  reducers: {
    setLendingContract: (state, action) => {
      state.contract = action.payload;
    },
    setReadOnlyLendingContract: (state, action) => {
      state.readOnlyContract = action.payload;
    },
    setLendingData: (state, action) => {
      const { totalPoolUSDC, totalShares, userShares } = action.payload;
      state.totalPoolUSDC = totalPoolUSDC;
      state.totalShares = totalShares;
      state.userShares = userShares;
    },
    setLoan: (state, action) => {
      const { nftId, borrower, borrowedAmount, repaid } = action.payload;
      state.loans[nftId] = { borrower, borrowedAmount, repaid };
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },

    // -------------------------------
    // Deposit lifecycle actions
    depositRequest: (state) => {
      state.depositing.isDepositing = true;
      state.depositing.isSuccess = false;
      state.depositing.transactionHash = null;
      state.depositing.error = null;
    },
    depositSuccess: (state, action) => {
      state.depositing.isDepositing = false;
      state.depositing.isSuccess = true;
      state.depositing.transactionHash = action.payload; // tx hash
      state.depositing.error = null;
    },
    depositFail: (state, action) => {
      state.depositing.isDepositing = false;
      state.depositing.isSuccess = false;
      state.depositing.transactionHash = null;
      state.depositing.error = action.payload; // error message
    },
    withdrawRequest: (state) => {
      state.withdrawing.isWithdrawing = true;
      state.withdrawing.isSuccess = false;
      state.withdrawing.transactionHash = null;
      state.withdrawing.error = null;
    },
    withdrawSuccess: (state, action) => {
      state.withdrawing.isWithdrawing = false;
      state.withdrawing.isSuccess = true;
      state.withdrawing.transactionHash = action.payload;
    },
    withdrawFail: (state, action) => {
      state.withdrawing.isWithdrawing = false;
      state.withdrawing.isSuccess = false;
      state.withdrawing.transactionHash = null;
      state.withdrawing.error = action.payload;
    },
  },
});

export const {
  setLendingContract,
  setReadOnlyLendingContract,
  setLendingData,
  setLoan,
  setLoading,
  setError,
  depositRequest,
  depositSuccess,
  depositFail,
  withdrawRequest,
  withdrawSuccess,
  withdrawFail,
} = lendingSlice.actions;

export default lendingSlice.reducer;

// selector to check contract readiness
export const selectLendingReady = (state) =>
  !!state.lending.contract && !!state.lending.contract.functions?.getPoolInfo;
