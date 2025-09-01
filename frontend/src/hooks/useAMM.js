import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useAccount } from 'wagmi';
import {
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
} from '../store/slices/ammSlice';
import { addTransaction, updateTransaction } from '../store/slices/userSlice';

export function useAMM() {
  const dispatch = useDispatch();
  const contracts = useContracts();
  const { address } = useAccount();
  const ammState = useSelector((state) => state.amm);

  // Fetch all AMM pools
  const fetchPools = useCallback(async () => {
    if (!contracts?.ammFactory) return;

    try {
      // In a real implementation, you'd query events or maintain a registry
      // For now, we'll simulate with known watchIds
      const pools = [];
      
      // Example: fetch pools for watchIds 1 and 2
      for (let watchId = 1; watchId <= 2; watchId++) {
        try {
          const poolAddress = await contracts.ammFactory.getPoolByWatch(watchId);
          if (poolAddress !== ethers.ZeroAddress) {
            const poolContract = contracts.getAMMPool(poolAddress);
            const [fractionBalance, usdcBalance, totalShares, price] = await Promise.all([
              poolContract.fractionBalance(),
              poolContract.usdcBalance(),
              poolContract.totalShares(),
              poolContract.poolPrice(),
            ]);

            pools.push({
              watchId,
              address: poolAddress,
              fractionBalance: ethers.formatUnits(fractionBalance, 18),
              usdcBalance: ethers.formatUnits(usdcBalance, 18),
              totalShares: ethers.formatUnits(totalShares, 18),
              price: ethers.formatUnits(price, 18),
            });
          }
        } catch (error) {
          console.warn(`Pool for watchId ${watchId} not found or error:`, error);
        }
      }

      dispatch(setPools(pools));
      return pools;
    } catch (error) {
      console.error('Error fetching pools:', error);
      throw error;
    }
  }, [contracts, dispatch]);

  // Fetch user's liquidity positions
  const fetchUserPositions = useCallback(async () => {
    if (!contracts?.ammFactory || !address) return;

    try {
      const positions = [];
      
      // Check user's shares in each pool
      for (const pool of ammState.pools.data) {
        try {
          const poolContract = contracts.getAMMPool(pool.address);
          const userShares = await poolContract.shares(address);
          
          if (userShares > 0) {
            positions.push({
              poolAddress: pool.address,
              watchId: pool.watchId,
              shares: ethers.formatUnits(userShares, 18),
              sharePercentage: pool.totalShares > 0 
                ? (Number(ethers.formatUnits(userShares, 18)) / Number(pool.totalShares) * 100).toFixed(2)
                : '0',
            });
          }
        } catch (error) {
          console.warn(`Error fetching position for pool ${pool.address}:`, error);
        }
      }

      dispatch(setUserPositions(positions));
      return positions;
    } catch (error) {
      console.error('Error fetching user positions:', error);
      throw error;
    }
  }, [contracts, address, dispatch, ammState.pools.data]);

  // Add liquidity to pool
  const addLiquidity = useCallback(async (poolAddress, fractionAmount, usdcAmount) => {
    if (!contracts) return;

    try {
      const signedContracts = await contracts.withSigner();
      const poolContract = signedContracts.getAMMPool(poolAddress);
      const fractionAmountWei = ethers.parseUnits(fractionAmount, 18);
      const usdcAmountWei = ethers.parseUnits(usdcAmount, 18);

      // Get fraction token address from pool
      const fractionTokenAddress = await contracts.getAMMPool(poolAddress).fractionToken();
      
      // Approve tokens if needed
      if (fractionAmount > 0) {
        const fractionToken = signedContracts.getFractionToken(fractionTokenAddress);
        const approveTx = await fractionToken.approve(poolAddress, fractionAmountWei);
        await approveTx.wait();
      }

      if (usdcAmount > 0) {
        const approveTx = await signedContracts.usdc.approve(poolAddress, usdcAmountWei);
        
        dispatch(addTransaction({
          hash: approveTx.hash,
          type: 'approve',
          status: 'pending',
          data: { token: 'USDC', amount: usdcAmount },
        }));

        await approveTx.wait();
        
        dispatch(updateTransaction({
          hash: approveTx.hash,
          status: 'completed',
        }));
      }

      // Add liquidity
      const tx = await poolContract.addLiquidity(fractionAmountWei, usdcAmountWei);
      
      dispatch(addTransaction({
        hash: tx.hash,
        type: 'add_liquidity',
        status: 'pending',
        data: { poolAddress, fractionAmount, usdcAmount },
      }));

      const receipt = await tx.wait();
      
      dispatch(updateTransaction({
        hash: tx.hash,
        status: 'completed',
        receipt,
      }));

      // Refresh data
      await fetchPools();
      await fetchUserPositions();

      return receipt;
    } catch (error) {
      console.error('Error adding liquidity:', error);
      throw error;
    }
  }, [contracts, dispatch, fetchPools, fetchUserPositions]);

  // Remove liquidity from pool
  const removeLiquidity = useCallback(async (poolAddress, shareAmount) => {
    if (!contracts) return;

    try {
      const signedContracts = await contracts.withSigner();
      const poolContract = signedContracts.getAMMPool(poolAddress);
      const shareAmountWei = ethers.parseUnits(shareAmount, 18);

      const tx = await poolContract.removeLiquidity(shareAmountWei);
      
      dispatch(addTransaction({
        hash: tx.hash,
        type: 'remove_liquidity',
        status: 'pending',
        data: { poolAddress, shareAmount },
      }));

      const receipt = await tx.wait();
      
      dispatch(updateTransaction({
        hash: tx.hash,
        status: 'completed',
        receipt,
      }));

      // Refresh data
      await fetchPools();
      await fetchUserPositions();

      return receipt;
    } catch (error) {
      console.error('Error removing liquidity:', error);
      throw error;
    }
  }, [contracts, dispatch, fetchPools, fetchUserPositions]);

  // Swap USDC for Fraction tokens
  const swapUSDCForFraction = useCallback(async (poolAddress, usdcAmount, minFractionOut = '0') => {
    if (!contracts) return;

    try {
      const signedContracts = await contracts.withSigner();
      const poolContract = signedContracts.getAMMPool(poolAddress);
      const usdcAmountWei = ethers.parseUnits(usdcAmount, 18);
      const minFractionOutWei = ethers.parseUnits(minFractionOut, 18);

      // Approve USDC
      const approveTx = await signedContracts.usdc.approve(poolAddress, usdcAmountWei);
      await approveTx.wait();

      // Execute swap
      const tx = await poolContract.swapUSDCForFraction(usdcAmountWei, minFractionOutWei);
      
      dispatch(addTransaction({
        hash: tx.hash,
        type: 'swap',
        status: 'pending',
        data: { from: 'USDC', to: 'Fraction', amount: usdcAmount },
      }));

      const receipt = await tx.wait();
      
      dispatch(updateTransaction({
        hash: tx.hash,
        status: 'completed',
        receipt,
      }));

      // Refresh data
      await fetchPools();

      return receipt;
    } catch (error) {
      console.error('Error swapping USDC for Fraction:', error);
      throw error;
    }
  }, [contracts, dispatch, fetchPools]);

  // Swap Fraction tokens for USDC
  const swapFractionForUSDC = useCallback(async (poolAddress, fractionAmount, minUsdcOut = '0') => {
    if (!contracts) return;

    try {
      const signedContracts = await contracts.withSigner();
      const poolContract = signedContracts.getAMMPool(poolAddress);
      const fractionAmountWei = ethers.parseUnits(fractionAmount, 18);
      const minUsdcOutWei = ethers.parseUnits(minUsdcOut, 18);

      // Approve the fraction token
      const fractionTokenAddress = await contracts.getAMMPool(poolAddress).fractionToken();
      const fractionToken = signedContracts.getFractionToken(fractionTokenAddress);
      const approveTx = await fractionToken.approve(poolAddress, fractionAmountWei);
      await approveTx.wait();

      // Execute swap
      const tx = await poolContract.swapFractionForUSDC(fractionAmountWei, minUsdcOutWei);
      
      dispatch(addTransaction({
        hash: tx.hash,
        type: 'swap',
        status: 'pending',
        data: { from: 'Fraction', to: 'USDC', amount: fractionAmount },
      }));

      const receipt = await tx.wait();
      
      dispatch(updateTransaction({
        hash: tx.hash,
        status: 'completed',
        receipt,
      }));

      // Refresh data
      await fetchPools();

      return receipt;
    } catch (error) {
      console.error('Error swapping Fraction for USDC:', error);
      throw error;
    }
  }, [contracts, dispatch, fetchPools]);

  // Get swap quotes
  const getSwapQuote = useCallback(async (poolAddress, fromToken, amount) => {
    if (!contracts || !amount || amount === '0') return null;

    try {
      const poolContract = contracts.getAMMPool(poolAddress);
      const amountWei = ethers.parseUnits(amount, 18);

      let quote;
      if (fromToken === 'usdc') {
        const [fractionOut, priceUsed] = await poolContract.quoteUSDCForFraction(amountWei);
        quote = {
          amountOut: ethers.formatUnits(fractionOut, 18),
          priceUsed: ethers.formatUnits(priceUsed, 18),
          type: 'usdcToFraction',
        };
      } else {
        const [usdcOut, priceUsed] = await poolContract.quoteFractionForUSDC(amountWei);
        quote = {
          amountOut: ethers.formatUnits(usdcOut, 18),
          priceUsed: ethers.formatUnits(priceUsed, 18),
          type: 'fractionToUsdc',
        };
      }

      dispatch(setSwapQuotes({ [quote.type]: quote }));
      return quote;
    } catch (error) {
      console.error('Error getting swap quote:', error);
      return null;
    }
  }, [contracts, dispatch]);

  return {
    ammState,
    fetchPools,
    fetchUserPositions,
    addLiquidity,
    removeLiquidity,
    swapUSDCForFraction,
    swapFractionForUSDC,
    getSwapQuote,
  };
}