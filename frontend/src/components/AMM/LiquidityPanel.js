import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAMM } from '../../hooks/useAMM';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

export default function LiquidityPanel({ selectedPool, onPoolSelect }) {
  const { ammState, addLiquidity, removeLiquidity } = useAMM();
  const userState = useSelector((state) => state.user);
  
  const [mode, setMode] = useState('add'); // 'add' or 'remove'
  const [fractionAmount, setFractionAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [shareAmount, setShareAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-select first pool if none selected
  useEffect(() => {
    if (!selectedPool && ammState.pools.data.length > 0) {
      onPoolSelect?.(ammState.pools.data[0]);
    }
  }, [selectedPool, ammState.pools.data, onPoolSelect]);

  // Calculate proportional amounts for adding liquidity
  useEffect(() => {
    if (mode === 'add' && selectedPool && usdcAmount && parseFloat(usdcAmount) > 0) {
      const poolPrice = parseFloat(selectedPool.price);
      if (poolPrice > 0) {
        const calculatedFractionAmount = parseFloat(usdcAmount) / poolPrice;
        setFractionAmount(calculatedFractionAmount.toFixed(6));
      }
    }
  }, [usdcAmount, selectedPool, mode]);

  const handleAddLiquidity = async () => {
    if (!selectedPool || !fractionAmount || !usdcAmount) return;

    setLoading(true);
    try {
      await addLiquidity(selectedPool.address, fractionAmount, usdcAmount);
      setFractionAmount('');
      setUsdcAmount('');
    } catch (error) {
      console.error('Add liquidity failed:', error);
      alert('Add liquidity failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!selectedPool || !shareAmount) return;

    setLoading(true);
    try {
      await removeLiquidity(selectedPool.address, shareAmount);
      setShareAmount('');
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      alert('Remove liquidity failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserPosition = () => {
    if (!selectedPool) return null;
    return ammState.userPositions.data.find(pos => pos.poolAddress === selectedPool.address);
  };

  const userPosition = getUserPosition();
  const usdcBalance = userState.balances.usdc;
  const fractionBalance = userState.balances.fractionTokens[selectedPool?.address] || '0';

  return (
    <div className="max-w-md mx-auto">
      {/* Pool Selector */}
      {ammState.pools.data.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Pool
          </label>
          <select
            value={selectedPool?.address || ''}
            onChange={(e) => {
              const pool = ammState.pools.data.find(p => p.address === e.target.value);
              onPoolSelect?.(pool);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ammState.pools.data.map((pool) => (
              <option key={pool.address} value={pool.address}>
                Watch #{pool.watchId} Pool
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPool ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('add')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'add'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Liquidity</span>
            </button>
            <button
              onClick={() => setMode('remove')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'remove'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MinusIcon className="w-4 h-4" />
              <span>Remove Liquidity</span>
            </button>
          </div>

          {/* User Position Summary */}
          {userPosition && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Your Position</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">LP Shares</p>
                  <p className="font-semibold text-blue-900">{parseFloat(userPosition.shares).toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Pool Share</p>
                  <p className="font-semibold text-blue-900">{userPosition.sharePercentage}%</p>
                </div>
              </div>
            </div>
          )}

          {mode === 'add' ? (
            /* Add Liquidity Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USDC Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={usdcAmount}
                    onChange={(e) => setUsdcAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setUsdcAmount(usdcBalance)}
                    className="absolute right-2 top-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    MAX
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Balance: {parseFloat(usdcBalance).toFixed(4)} USDC
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  W{selectedPool.watchId} Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={fractionAmount}
                    onChange={(e) => setFractionAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setFractionAmount(fractionBalance)}
                    className="absolute right-2 top-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    MAX
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Balance: {parseFloat(fractionBalance).toFixed(4)} W{selectedPool.watchId}
                </p>
              </div>

              {/* Pool Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Price:</span>
                    <span className="font-medium">{parseFloat(selectedPool.price).toFixed(4)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pool Ratio:</span>
                    <span className="font-medium">
                      {selectedPool.fractionBalance > 0 && selectedPool.usdcBalance > 0
                        ? `1 W${selectedPool.watchId} : ${(parseFloat(selectedPool.usdcBalance) / parseFloat(selectedPool.fractionBalance)).toFixed(2)} USDC`
                        : 'No liquidity'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddLiquidity}
                disabled={loading || !fractionAmount || !usdcAmount || parseFloat(fractionAmount) <= 0 || parseFloat(usdcAmount) <= 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Adding Liquidity...' : 'Add Liquidity'}
              </button>
            </div>
          ) : (
            /* Remove Liquidity Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LP Shares to Remove
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={shareAmount}
                    onChange={(e) => setShareAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShareAmount(userPosition?.shares || '0')}
                    className="absolute right-2 top-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    MAX
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available: {userPosition ? parseFloat(userPosition.shares).toFixed(4) : '0.00'} shares
                </p>
              </div>

              {/* Removal Preview */}
              {shareAmount && parseFloat(shareAmount) > 0 && selectedPool.totalShares > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-900 mb-2">You will receive:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-red-700">W{selectedPool.watchId}:</span>
                      <span className="font-medium text-red-900">
                        {((parseFloat(shareAmount) / parseFloat(selectedPool.totalShares)) * parseFloat(selectedPool.fractionBalance)).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">USDC:</span>
                      <span className="font-medium text-red-900">
                        {((parseFloat(shareAmount) / parseFloat(selectedPool.totalShares)) * parseFloat(selectedPool.usdcBalance)).toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleRemoveLiquidity}
                disabled={loading || !shareAmount || parseFloat(shareAmount) <= 0 || !userPosition}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Removing Liquidity...' : 'Remove Liquidity'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Pool</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a pool from the Pools tab to manage liquidity
          </p>
        </div>
      )}
    </div>
  );
}