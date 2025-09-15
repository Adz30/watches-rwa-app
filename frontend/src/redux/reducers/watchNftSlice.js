// redux/reducers/watchNftSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  contract: null,
  balance: 0,
  ownedTokens: [],
  tokenURIs: {},
  tokenMetadata: {},
  loading: false,
  error: null,
};

const watchNFTSlice = createSlice({
  name: 'watchNFT',
  initialState,
  reducers: {
    setWatchNFTContract(state, action) {
      state.contract = action.payload;
    },
    setBalance(state, action) {
      state.balance = action.payload;
    },
    setOwnedTokens(state, action) {
      state.ownedTokens = action.payload;
    },
    setTokenURI(state, action) {
      const { tokenId, uri } = action.payload;
      state.tokenURIs[tokenId] = uri;
    },
    setTokenMetadata(state, action) {
      const { tokenId, metadata } = action.payload;
      state.tokenMetadata[tokenId] = metadata;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    resetWatchNFT(state) {
      state.contract = null;
      state.balance = 0;
      state.ownedTokens = [];
      state.tokenURIs = {};
      state.tokenMetadata = {};
      state.loading = false;
      state.error = null;
    },
  },
});

// Export actions
export const {
  setWatchNFTContract,
  setBalance,
  setOwnedTokens,
  setTokenURI,
  setTokenMetadata,
  setLoading,
  setError,
  resetWatchNFT,
} = watchNFTSlice.actions;

export default watchNFTSlice.reducer;

// ----------------------------
// Selector to check if contract is fully ready
export const selectWatchNftContractReady = (state) =>
  !!state.watchNft.contract &&
  typeof state.watchNft.contract.tokensOfOwner === 'function';
