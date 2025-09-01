import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useAccount } from 'wagmi';
import { setBalances, updateBalance } from '../store/slices/userSlice';

export function useBalances() {
  const dispatch = useDispatch();
  const contracts = useContracts();
  const { address, isConnected } = useAccount();
  const userState = useSelector((state) => state.user);

  // Fetch ETH balance
  const fetchETHBalance = useCallback(async () => {
    if (!contracts?.provider || !address) return;

    try {
      const balance = await contracts.provider.getBalance(address);
      const balanceFormatted = ethers.formatEther(balance);
      dispatch(updateBalance({ token: 'eth', balance: balanceFormatted }));
      return balanceFormatted;
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      return '0';
    }
  }, [contracts, address, dispatch]);

  // Fetch USDC balance
  const fetchUSDCBalance = useCallback(async () => {
    if (!contracts?.usdc || !address) return;

    try {
      const balance = await contracts.usdc.balanceOf(address);
      const balanceFormatted = ethers.formatUnits(balance, 18);
      dispatch(updateBalance({ token: 'usdc', balance: balanceFormatted }));
      return balanceFormatted;
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      return '0';
    }
  }, [contracts, address, dispatch]);

  // Fetch fraction token balance
  const fetchFractionBalance = useCallback(async (tokenAddress) => {
    if (!contracts || !address || !tokenAddress) return;

    try {
      const fractionToken = contracts.getFractionToken(tokenAddress);
      const balance = await fractionToken.balanceOf(address);
      const balanceFormatted = ethers.formatUnits(balance, 18);
      
      dispatch(updateBalance({ 
        token: tokenAddress, 
        balance: balanceFormatted 
      }));
      
      return balanceFormatted;
    } catch (error) {
      console.error('Error fetching fraction token balance:', error);
      return '0';
    }
  }, [contracts, address, dispatch]);

  // Fetch all balances
  const fetchAllBalances = useCallback(async () => {
    if (!isConnected || !address) return;

    try {
      const [ethBalance, usdcBalance] = await Promise.all([
        fetchETHBalance(),
        fetchUSDCBalance(),
      ]);

      dispatch(setBalances({
        eth: ethBalance,
        usdc: usdcBalance,
        fractionTokens: userState.balances.fractionTokens, // Keep existing fraction balances
      }));
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }, [isConnected, address, fetchETHBalance, fetchUSDCBalance, dispatch, userState.balances.fractionTokens]);

  // Auto-fetch balances when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchAllBalances();
    }
  }, [isConnected, address, fetchAllBalances]);

  return {
    balances: userState.balances,
    fetchETHBalance,
    fetchUSDCBalance,
    fetchFractionBalance,
    fetchAllBalances,
  };
}