import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useContracts } from './useContracts';
import { useAccount } from 'wagmi';
import {
  setUserNFTs,
  setNFTMetadata,
  setFractionalizedInfo,
  setCollateralStatus,
  updateCollateralStatus,
} from '../store/slices/nftSlice';

export function useNFT() {
  const dispatch = useDispatch();
  const contracts = useContracts();
  const { address } = useAccount();
  const nftState = useSelector((state) => state.nft);

  // Fetch user's NFTs
  const fetchUserNFTs = useCallback(async () => {
    if (!contracts?.watchRegistry || !address) return;

    try {
      // In a real implementation, you'd query Transfer events or use a subgraph
      // For now, we'll simulate with known NFT IDs
      const userNFTs = [];
      
      // Check ownership of NFTs 1-10 (example)
      for (let tokenId = 1; tokenId <= 10; tokenId++) {
        try {
          const owner = await contracts.watchRegistry.ownerOf(tokenId);
          if (owner.toLowerCase() === address.toLowerCase()) {
            const tokenURI = await contracts.watchRegistry.tokenURI(tokenId);
            userNFTs.push({
              tokenId,
              owner,
              tokenURI,
            });
          }
        } catch (error) {
          // NFT doesn't exist or other error, skip
          continue;
        }
      }

      dispatch(setUserNFTs(userNFTs));
      return userNFTs;
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      throw error;
    }
  }, [contracts, address, dispatch]);

  // Fetch NFT metadata from IPFS/URI
  const fetchNFTMetadata = useCallback(async (tokenId, tokenURI) => {
    try {
      // For demo purposes, we'll create mock metadata
      // In production, you'd fetch from IPFS or the actual URI
      const metadata = {
        name: `Luxury Watch #${tokenId}`,
        description: `A premium luxury watch with unique characteristics`,
        image: `https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400`,
        attributes: [
          { trait_type: "Brand", value: "Rolex" },
          { trait_type: "Model", value: "Submariner" },
          { trait_type: "Year", value: "2023" },
          { trait_type: "Condition", value: "Mint" },
        ],
      };

      dispatch(setNFTMetadata({ tokenId, metadata }));
      return metadata;
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      throw error;
    }
  }, [dispatch]);

  // Check if NFT is fractionalized
  const checkFractionalizationStatus = useCallback(async (tokenId) => {
    if (!contracts) return;

    try {
      // You'd need to check the fractionalizer factory
      // For now, we'll simulate
      const isFramentalized = false; // Check actual contract
      const fractionTokenAddress = null; // Get from contract
      
      dispatch(setFractionalizedInfo({
        tokenId,
        info: {
          isFramentalized,
          fractionTokenAddress,
          totalShares: '0',
        },
      }));
    } catch (error) {
      console.error('Error checking fractionalization status:', error);
    }
  }, [contracts, dispatch]);

  // Check NFT collateral status
  const checkCollateralStatus = useCallback(async (tokenId) => {
    if (!contracts?.nftCollateralLending) return;

    try {
      const [borrower, borrowedAmount, repaid] = await contracts.nftCollateralLending.getLoan(tokenId);
      
      const status = {
        isCollateral: borrower !== ethers.ZeroAddress,
        borrower,
        borrowedAmount: borrowedAmount ? ethers.formatUnits(borrowedAmount, 18) : '0',
        repaid,
        canBorrow: borrower === ethers.ZeroAddress,
      };

      dispatch(setCollateralStatus({ tokenId, status }));
      return status;
    } catch (error) {
      console.error('Error checking collateral status:', error);
      throw error;
    }
  }, [contracts, dispatch]);

  // Get comprehensive NFT info
  const getNFTInfo = useCallback(async (tokenId) => {
    try {
      const [metadata, collateralStatus] = await Promise.all([
        fetchNFTMetadata(tokenId),
        checkCollateralStatus(tokenId),
        checkFractionalizationStatus(tokenId),
      ]);

      return {
        tokenId,
        metadata,
        collateralStatus,
      };
    } catch (error) {
      console.error('Error getting NFT info:', error);
      throw error;
    }
  }, [fetchNFTMetadata, checkCollateralStatus, checkFractionalizationStatus]);

  return {
    nftState,
    fetchUserNFTs,
    fetchNFTMetadata,
    checkFractionalizationStatus,
    checkCollateralStatus,
    getNFTInfo,
  };
}