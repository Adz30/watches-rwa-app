import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLending } from '../../hooks/useLending';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

export default function LenderPanel() {
  const { lendingState, depositUSDC, withdrawUSDC } = useLending();
  const userState = useSelector((state) => state.user);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawShares, setWithdrawShares] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    setLoading(true);
    try {
      await depositUSDC(depositAmount);
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit failed:', error);
      alert('Deposit failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawShares || parseFloat(withdrawShares) <= 0) return;

    setLoading(true);
    try {
      await withdrawUSDC(withdrawShares);
      setWithdrawShares('');
    } catch (error) {
      console.error('Withdraw failed:', error);
      alert('Withdraw failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const maxWithdrawShares = lendingState.lenderInfo.shares;
  const usdcBalance = userState.balances.usdc;

  return (
    <div className="space-y-6">
      {/* Lender Position Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Lending Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">LP Shares</p>
            <p className="text-xl font-bold text-gray-900">
              {parseFloat(lendingState.lenderInfo.shares).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">USDC Value</p>
            <p className="text-xl font-bold text-gray-900">
              {parseFloat(lendingState.lenderInfo.usdcValue).toFixed(2)} USDC
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pool Share</p>
            <p className="text-xl font-bold text-gray-900">
              {lendingState.poolInfo.totalShares > 0
                ? ((parseFloat(lendingState.lenderInfo.shares) / parseFloat(lendingState.poolInfo.totalShares)) * 100).toFixed(2)
                : '0.00'}%
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit USDC */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PlusIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Deposit USDC</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setDepositAmount(usdcBalance)}
                  className="absolute right-2 top-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Balance: {parseFloat(usdcBalance).toFixed(2)} USDC
              </p>
            </div>

            <button
              onClick={handleDeposit}
              disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Depositing...' : 'Deposit USDC'}
            </button>
          </div>
        </div>

        {/* Withdraw USDC */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MinusIcon className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Withdraw USDC</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LP Shares to Burn
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={withdrawShares}
                  onChange={(e) => setWithdrawShares(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setWithdrawShares(maxWithdrawShares)}
                  className="absolute right-2 top-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: {parseFloat(maxWithdrawShares).toFixed(2)} shares
              </p>
            </div>

            {withdrawShares && parseFloat(withdrawShares) > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  You will receive approximately:{' '}
                  <span className="font-semibold">
                    {lendingState.poolInfo.totalShares > 0
                      ? ((parseFloat(withdrawShares) / parseFloat(lendingState.poolInfo.totalShares)) * parseFloat(lendingState.poolInfo.totalPoolUSDC)).toFixed(2)
                      : '0.00'} USDC
                  </span>
                </p>
              </div>
            )}

            <button
              onClick={handleWithdraw}
              disabled={loading || !withdrawShares || parseFloat(withdrawShares) <= 0 || parseFloat(withdrawShares) > parseFloat(maxWithdrawShares)}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Withdrawing...' : 'Withdraw USDC'}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {lendingState.transactions.completed.slice(0, 5).map((tx, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  tx.type === 'deposit' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium capitalize">{tx.type}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {tx.data?.amount} {tx.data?.token || 'USDC'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(tx.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {lendingState.transactions.completed.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}