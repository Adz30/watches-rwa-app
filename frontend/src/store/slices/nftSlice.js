import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for NFT operations
export const fetchUserNFTs = createAsyncThunk(
  'nft/fetchUserNFTs',
  async (address, { rejectWithValue }) => {
    try {
      // This will be implemented in the contract hooks
      return [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNFTMetadata = createAsyncThunk(
  'nft/fetchMetadata',
  async (tokenId, { rejectWithValue }) => {
    try {
      // This will be implemented in the contract hooks
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const nftSlice = createSlice({
  name: 'nft',
  initialState: {
    userNFTs: {
      data: [],
      loading: false,
      error: null,
    },
    nftMetadata: {
      data: {}, // tokenId -> metadata
      loading: {},
      error: {},
    },
    fractionalized: {
      data: {}, // tokenId -> fraction token info
      loading: false,
      error: null,
    },
    collateralStatus: {
      data: {}, // tokenId -> loan status
      loading: false,
      error: null,
    },
  },
  reducers: {
    setUserNFTs: (state, action) => {
      state.userNFTs.data = action.payload;
      state.userNFTs.loading = false;
      state.userNFTs.error = null;
    },
    setNFTMetadata: (state, action) => {
      const { tokenId, metadata } = action.payload;
      state.nftMetadata.data[tokenId] = metadata;
      state.nftMetadata.loading[tokenId] = false;
      state.nftMetadata.error[tokenId] = null;
    },
    setFractionalizedInfo: (state, action) => {
      const { tokenId, info } = action.payload;
      state.fractionalized.data[tokenId] = info;
    },
    setCollateralStatus: (state, action) => {
      const { tokenId, status } = action.payload;
      state.collateralStatus.data[tokenId] = status;
    },
    updateCollateralStatus: (state, action) => {
      const { tokenId, updates } = action.payload;
      if (state.collateralStatus.data[tokenId]) {
        state.collateralStatus.data[tokenId] = {
          ...state.collateralStatus.data[tokenId],
          ...updates,
        };
      }
    },
    setLoading: (state, action) => {
      const { section, loading, tokenId } = action.payload;
      if (tokenId && state[section].loading) {
        state[section].loading[tokenId] = loading;
      } else if (state[section]) {
        state[section].loading = loading;
      }
    },
    setError: (state, action) => {
      const { section, error, tokenId } = action.payload;
      if (tokenId && state[section].error) {
        state[section].error[tokenId] = error;
      } else if (state[section]) {
        state[section].error = error;
        state[section].loading = false;
      }
    },
    clearError: (state, action) => {
      const { section, tokenId } = action.payload;
      if (tokenId && state[section].error) {
        state[section].error[tokenId] = null;
      } else if (state[section]) {
        state[section].error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserNFTs.pending, (state) => {
        state.userNFTs.loading = true;
        state.userNFTs.error = null;
      })
      .addCase(fetchUserNFTs.fulfilled, (state, action) => {
        state.userNFTs.loading = false;
        state.userNFTs.data = action.payload;
      })
      .addCase(fetchUserNFTs.rejected, (state, action) => {
        state.userNFTs.loading = false;
        state.userNFTs.error = action.payload;
      })
      .addCase(fetchNFTMetadata.pending, (state, action) => {
        const tokenId = action.meta.arg;
        state.nftMetadata.loading[tokenId] = true;
        state.nftMetadata.error[tokenId] = null;
      })
      .addCase(fetchNFTMetadata.fulfilled, (state, action) => {
        const tokenId = action.meta.arg;
        state.nftMetadata.loading[tokenId] = false;
        state.nftMetadata.data[tokenId] = action.payload;
      })
      .addCase(fetchNFTMetadata.rejected, (state, action) => {
        const tokenId = action.meta.arg;
        state.nftMetadata.loading[tokenId] = false;
        state.nftMetadata.error[tokenId] = action.payload;
      });
  },
});

export const {
  setUserNFTs,
  setNFTMetadata,
  setFractionalizedInfo,
  setCollateralStatus,
  updateCollateralStatus,
  setLoading,
  setError,
  clearError,
} = nftSlice.actions;

export default nftSlice.reducer;