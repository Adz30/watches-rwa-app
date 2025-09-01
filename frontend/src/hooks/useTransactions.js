import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTransaction, updateTransaction } from '../store/slices/userSlice';
import { addPendingTransaction, completePendingTransaction } from '../store/slices/lendingSlice';
import { addPendingTransaction as addAMMTransaction, completePendingTransaction as completeAMMTransaction } from '../store/slices/ammSlice';

export function useTransactions() {
  const dispatch = useDispatch();
  const userTransactions = useSelector((state) => state.user.transactions);
  const lendingTransactions = useSelector((state) => state.lending.transactions);
  const ammTransactions = useSelector((state) => state.amm.transactions);

  // Track a new transaction
  const trackTransaction = useCallback((txData) => {
    const transaction = {
      hash: txData.hash,
      type: txData.type,
      status: 'pending',
      data: txData.data,
      timestamp: Date.now(),
    };

    // Add to user transactions
    dispatch(addTransaction(transaction));

    // Add to specific module transactions
    if (['deposit', 'withdraw', 'borrow', 'repay'].includes(txData.type)) {
      dispatch(addPendingTransaction(transaction));
    } else if (['swap', 'add_liquidity', 'remove_liquidity'].includes(txData.type)) {
      dispatch(addAMMTransaction(transaction));
    }

    return transaction;
  }, [dispatch]);

  // Update transaction status
  const updateTransactionStatus = useCallback((hash, status, receipt = null) => {
    const updateData = { hash, status, receipt };

    // Update user transactions
    dispatch(updateTransaction(updateData));

    // Update specific module transactions
    if (status === 'completed') {
      dispatch(completePendingTransaction(hash));
      dispatch(completeAMMTransaction(hash));
    }
  }, [dispatch]);

  // Wait for transaction confirmation
  const waitForTransaction = useCallback(async (tx, onUpdate = null) => {
    try {
      const receipt = await tx.wait();
      updateTransactionStatus(tx.hash, 'completed', receipt);
      onUpdate?.('completed', receipt);
      return receipt;
    } catch (error) {
      updateTransactionStatus(tx.hash, 'failed', { error: error.message });
      onUpdate?.('failed', error);
      throw error;
    }
  }, [updateTransactionStatus]);

  // Execute transaction with tracking
  const executeTransaction = useCallback(async (contractMethod, txData, onUpdate = null) => {
    try {
      // Track transaction as pending
      const transaction = trackTransaction(txData);
      onUpdate?.('pending', transaction);

      // Execute the contract method
      const tx = await contractMethod();
      
      // Update with transaction hash
      updateTransactionStatus(tx.hash, 'pending');
      
      // Wait for confirmation
      const receipt = await waitForTransaction(tx, onUpdate);
      
      return { transaction, receipt };
    } catch (error) {
      console.error('Transaction execution failed:', error);
      throw error;
    }
  }, [trackTransaction, updateTransactionStatus, waitForTransaction]);

  // Get pending transactions count
  const getPendingCount = useCallback(() => {
    return userTransactions.pending.length;
  }, [userTransactions.pending.length]);

  // Get recent transactions
  const getRecentTransactions = useCallback((limit = 10) => {
    return [...userTransactions.completed]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit);
  }, [userTransactions.completed]);

  return {
    trackTransaction,
    updateTransactionStatus,
    waitForTransaction,
    executeTransaction,
    getPendingCount,
    getRecentTransactions,
    userTransactions,
    lendingTransactions,
    ammTransactions,
  };
}