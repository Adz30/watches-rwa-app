import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { useAccount } from 'wagmi';
import {
  setPoolInfo,
  setLenderInfo,
  addLoan,
  repayLoan,
  addPendingTransaction,
  completePendingTransaction,
} from '../store/slices/lendingSlice';
import { addTransaction, updateTransaction } from '../store/slices/userSlice';

export function useLending() {
  const dispatch = useDispatch();
  const contracts = useContracts();
  const { address } = useAccount();
  const lendingState = useSelector((state) => state.lending);

  // Fetch pool information
  const fetchPoolInfo = useCallback(async () => {
    if (!contracts?.nftCollateralLending) return;

    try {
      const [totalPoolUSDC, totalShares] = await contracts.nftCollateralLending.getPoolInfo();
      dispatch(setPoolInfo({
        totalPoolUSDC: ethers.formatUnits(totalPoolUSDC, 18),
        totalShares: ethers.formatUnits(totalShares, 18),
      }));
    } catch (error) {
      console.error('Error fetching pool info:', error);
    }
  }, [contracts, dispatch]);

  // Fetch lender information
  const fetchLenderInfo = useCallback(async () => {
    if (!contracts?.nftCollateralLending || !address) return;

    try {
      const [shares, usdcValue] = await contracts.nftCollateralLending.getLender(address);
      dispatch(setLenderInfo({
        shares: ethers.formatUnits(shares, 18),
        usdcValue: ethers.formatUnits(usdcValue, 18),
      }));
    } catch (error) {
      console.error('Error fetching lender info:', error);
    }
  }, [contracts, address, dispatch]);

  // Deposit USDC into lending pool
  const depositUSDC = useCallback(async (amount) => {
    if (!contracts?.nftCollateralLending || !contracts?.usdc) return;

    try {
      const amountWei = ethers.parseUnits(amount, 18);
      
      // First approve USDC
      const approveTx = await contracts.usdc.approve(
        contracts.nftCollateralLending.target,
        amountWei
      );
      
      dispatch(addTransaction({
        hash: approveTx.hash,
        type: 'approve',
        status: 'pending',
        data: { token: 'USDC', amount },
      }));

      await approveTx.wait();
      
      dispatch(updateTransaction({
        hash: approveTx.hash,
        status: 'completed',
      }));

      // Then deposit
      const depositTx = await contracts.nftCollateralLending.deposit(amountWei);
      
      dispatch(addTransaction({
        hash: depositTx.hash,
        type: 'deposit',
        status: 'pending',
        data: { amount },
      }));

      const receipt = await depositTx.wait();
      
      dispatch(updateTransaction({
        hash: depositTx.hash,
        status: 'completed',
        receipt,
      }));

      // Refresh data
      await fetchPoolInfo();
      await fetchLenderInfo();

      return receipt;
    } catch (error) {
      console.error('Error depositing USDC:', error);
      throw error;
    }
  }, [contracts, dispatch, fetchPoolInfo, fetchLenderInfo]);

  // Withdraw USDC from lending pool
  const withdrawUSDC = useCallback(async (shareAmount) => {
    if (!contracts?.nftCollateralLending) return;

    try {
      const shareAmountWei = ethers.parseUnits(shareAmount, 18);
      const tx = await contracts.nftCollateralLending.withdraw(shareAmountWei);
      
      dispatch(addTransaction({
        hash: tx.hash,
        type: 'withdraw',
        status: 'pending',
        data: { shareAmount },
      }));

      const receipt = await tx.wait();
      
      dispatch(updateTransaction({
        hash: tx.hash,
        status: 'completed',
        receipt,
      }));

      // Refresh data
      await fetchPoolInfo();
      await fetchLenderInfo();

      return receipt;
    } catch (error) {
      console.error('Error withdrawing USDC:', error);
      throw error;
    }
  }, [contracts, dispatch, fetchPoolInfo, fetchLenderInfo]);

  // Deposit NFT and borrow USDC
  const depositNFTAndBorrow = useCallback(async (nftId) => {
    if (!contracts?.nftCollateralLending || !contracts?.watchRegistry) return;

    try {
      // First approve NFT
      const approveTx = await contracts.watchRegistry.approve(
        contracts.nftCollateralLending.target,
        nftId
      );
      
      dispatch(addTransaction({
        hash: approveTx.hash,
        type: 'approve_nft',
        status: 'pending',
        data: { nftId },
      }));

      await approveTx.wait();
      
      dispatch(updateTransaction({
        hash: approveTx.hash,
        status: 'completed',
      }));

      // Then deposit and borrow
      const borrowTx = await contracts.nftCollateralLending.depositNFTAndBorrow(nftId);
      
      dispatch(addTransaction({
        hash: borrowTx.hash,
        type: 'borrow',
        status: 'pending',
        data: { nftId },
      }));

      const receipt = await borrowTx.wait();
      
      dispatch(updateTransaction({
        hash: borrowTx.hash,
        status: 'completed',
        receipt,
      }));

      // Add loan to state
      const [borrower, borrowedAmount, repaid] = await contracts.nftCollateralLending.getLoan(nftId);
      dispatch(addLoan({
        nftId,
        borrower,
        borrowedAmount: ethers.formatUnits(borrowedAmount, 18),
        repaid,
      }));

      // Refresh data
      await fetchPoolInfo();

      return receipt;
    } catch (error) {
      console.error('Error depositing NFT and borrowing:', error);
      throw error;
    }
  }, [contracts, dispatch, fetchPoolInfo]);

  // Repay loan
  const repayLoanFn = useCallback(async (nftId) => {
    if (!contracts?.nftCollateralLending || !contracts?.usdc) return;

    try {
      // Get loan info to calculate repayment amount
      const [borrower, borrowedAmount, repaid] = await contracts.nftCollateralLending.getLoan(nftId);
      
      if (repaid) {
        throw new Error('Loan already repaid');
      }

      // Calculate repayment with interest (2% from contract)
      const interest = (borrowedAmount * 200n) / 10000n; // 2% interest
      const repaymentAmount = borrowedAmount + interest;

      // First approve USDC
      const approveTx = await contracts.usdc.approve(
        contracts.nftCollateralLending.target,
        repaymentAmount
      );
      
      dispatch(addTransaction({
        hash: approveTx.hash,
        type: 'approve',
        status: 'pending',
        data: { token: 'USDC', amount: ethers.formatUnits(repaymentAmount, 18) },
      }));

      await approveTx.wait();
      
      dispatch(updateTransaction({
        hash: approveTx.hash,
        status: 'completed',
      }));

      // Then repay
      const repayTx = await contracts.nftCollateralLending.repayLoan(nftId);
      
      dispatch(addTransaction({
        hash: repayTx.hash,
        type: 'repay',
        status: 'pending',
        data: { nftId, amount: ethers.formatUnits(repaymentAmount, 18) },
      }));

      const receipt = await repayTx.wait();
      
      dispatch(updateTransaction({
        hash: repayTx.hash,
        status: 'completed',
        receipt,
      }));

      // Update loan status
      dispatch(repayLoan(nftId));

      // Refresh data
      await fetchPoolInfo();

      return receipt;
    } catch (error) {
      console.error('Error repaying loan:', error);
      throw error;
    }
  }, [contracts, dispatch, fetchPoolInfo]);

  return {
    lendingState,
    fetchPoolInfo,
    fetchLenderInfo,
    depositUSDC,
    withdrawUSDC,
    depositNFTAndBorrow,
    repayLoan: repayLoanFn,
  };
}