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
  borrowing: {
    isBorrowing: false,
    isSuccess: false,
    transactionHash: null,
    error: null,
    nftId: null,
    borrowedAmount: null,
  },
  repaying: {
    isRepaying: false,
    isSuccess: false,
    transactionHash: null,
    error: null,
    nftId: null,
    repaymentAmount: null,
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
      const { nftId, borrower, borrowedAmount, repaid, repayment } =
        action.payload;
      state.loans[nftId] = { borrower, borrowedAmount, repaid, repayment };
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
    borrowRequest: (state, action) => {
      state.borrowing.isBorrowing = true;
      state.borrowing.isSuccess = false;
      state.borrowing.transactionHash = null;
      state.borrowing.error = null;
      state.borrowing.nftId = action.payload; // tokenId being borrowed
      state.borrowing.borrowedAmount = null;
    },
    borrowSuccess: (state, action) => {
      const { nftId, borrowedAmount, transactionHash } = action.payload;
      state.borrowing.isBorrowing = false;
      state.borrowing.isSuccess = true;
      state.borrowing.transactionHash = transactionHash;
      state.borrowing.error = null;
      state.borrowing.nftId = nftId;
      state.borrowing.borrowedAmount = borrowedAmount;

      // also update loans mapping
      state.loans[nftId] = {
        borrower: state.contract.signer?.getAddress() || null,
        borrowedAmount,
        repaid: false,
      };
    },
    borrowFail: (state, action) => {
      state.borrowing.isBorrowing = false;
      state.borrowing.isSuccess = false;
      state.borrowing.transactionHash = null;
      state.borrowing.error = action.payload;
      state.borrowing.nftId = null;
      state.borrowing.borrowedAmount = null;
    },
    repayRequest: (state, action) => {
      state.repaying.isRepaying = true;
      state.repaying.isSuccess = false;
      state.repaying.transactionHash = null;
      state.repaying.error = null;
      state.repaying.nftId = action.payload; // NFT being repaid
      state.repaying.repaymentAmount = null;
    },
    repaySuccess: (state, action) => {
      const { nftId, repaymentAmount, transactionHash } = action.payload;
      state.repaying.isRepaying = false;
      state.repaying.isSuccess = true;
      state.repaying.transactionHash = transactionHash;
      state.repaying.error = null;
      state.repaying.nftId = nftId;
      state.repaying.repaymentAmount = repaymentAmount;

      // ✅ mark loan as repaid
      if (state.loans[nftId]) {
        state.loans[nftId].repaid = true;
        state.loans[nftId].repayment = repaymentAmount;
      }
    },
    repayFail: (state, action) => {
      state.repaying.isRepaying = false;
      state.repaying.isSuccess = false;
      state.repaying.transactionHash = null;
      state.repaying.error = action.payload;
      state.repaying.nftId = null;
      state.repaying.repaymentAmount = null;
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
  borrowRequest,
  borrowSuccess,
  borrowFail,
  repayRequest,
  repaySuccess,
  repayFail,
} = lendingSlice.actions;

export default lendingSlice.reducer;

// selector to check contract readiness
export const selectLendingReady = (state) =>
  !!state.lending.contract && !!state.lending.contract.functions?.getPoolInfo;
export const selectBorrowing = (state) => state.lending.borrowing;
