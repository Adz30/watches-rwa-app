import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAMM } from '../../hooks/useAMM';
import { ArrowsUpDownIcon, CogIcon } from '@heroicons/react/24/outline';

export default function SwapPanel({ selectedPool, onPoolSelect }) {
  const { ammState, swapUSDCForFraction, swapFractionForUSDC, getSwapQuote } = useAMM();
  const userState = useSelector((state) => state.user);
  
  const [fromToken, setFromToken] = useState('usdc');
  const [toToken, setToToken] = useState('fraction');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [slippage, setSlippage] = useState('0.5');

  // Auto-select first pool if none selected
  useEffect(() => {
    if (!selectedPool && ammState.pools.data.length > 0) {
      onPoolSelect?.(ammState.pools.data[0]);
    }
  }, [selectedPool, ammState.pools.data, onPoolSelect]);

  // Get quote when amount changes
  useEffect(() => {
    const getQuote = async () => {
      if (!selectedPool || !fromAmount || parseFloat(fromAmount) <= 0) {
        setToAmount('');
        return;
      }

      setQuoteLoading(true);
      try {
        const quote = await getSwapQuote(selectedPool.address, fromToken, fromAmount);
        if (quote) {
          setToAmount(quote.amountOut);
        }
      } catch (error) {
        console.error('Error getting quote:', error);
        setToAmount('');
      } finally {
        setQuoteLoading(false);
      }
    };

    const timeoutId = setTimeout(getQuote, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [selectedPool, fromAmount, fromToken, getSwapQuote]);

  const handleSwap = async () => {
    if (!selectedPool || !fromAmount || parseFloat(fromAmount) <= 0) return;

    setLoading(true);
    try {
      const minOut = toAmount ? (parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toString() : '0';
      
      if (fromToken === 'usdc') {
        await swapUSDCForFraction(selectedPool.address, fromAmount, minOut);
      } else {
        await swapFractionForUSDC(selectedPool.address, fromAmount, minOut);
      }
      
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const getTokenBalance = (token) => {
    if (token === 'usdc') {
      return userState.balances.usdc;
    }
    // For fraction tokens, you'd need to track balances per pool
    return '0';
  };

  const getTokenSymbol = (token) => {
    if (token === 'usdc') return 'USDC';
    return selectedPool ? `W${selectedPool.watchId}` : 'FRACTION';
  };

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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Swap Tokens</h3>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <CogIcon className="w-5 h-5" />
            </button>
          </div>

          {/* From Token */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">From</span>
                <span className="text-xs text-gray-500">
                  Balance: {parseFloat(getTokenBalance(fromToken)).toFixed(4)} {getTokenSymbol(fromToken)}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-xl font-semibold text-gray-900 placeholder-gray-400 border-none outline-none"
                />
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{getTokenSymbol(fromToken)}</span>
                  <button
                    onClick={() => setFromAmount(getTokenBalance(fromToken))}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            {/* Flip Button */}
            <div className="flex justify-center">
              <button
                onClick={handleFlipTokens}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ArrowsUpDownIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* To Token */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">To</span>
                <span className="text-xs text-gray-500">
                  Balance: {parseFloat(getTokenBalance(toToken)).toFixed(4)} {getTokenSymbol(toToken)}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={quoteLoading ? 'Loading...' : toAmount}
                  readOnly
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-xl font-semibold text-gray-900 placeholder-gray-400 border-none outline-none"
                />
                <span className="font-medium text-gray-900">{getTokenSymbol(toToken)}</span>
              </div>
            </div>

            {/* Swap Details */}
            {toAmount && !quoteLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">{parseFloat(selectedPool.price).toFixed(4)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slippage Tolerance:</span>
                    <span className="font-medium">{slippage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Received:</span>
                    <span className="font-medium">
                      {(parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toFixed(4)} {getTokenSymbol(toToken)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0 || !toAmount}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Swapping...' : `Swap ${getTokenSymbol(fromToken)} for ${getTokenSymbol(toToken)}`}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <ArrowsRightLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Pool</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a pool from the Pools tab to start swapping
          </p>
        </div>
      )}
    </div>
  );
}