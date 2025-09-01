import { CurrencyDollarIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export default function PoolCard({ pool, onSelect }) {
  const totalValue = (parseFloat(pool.usdcBalance) * 2).toFixed(2);
  const price = parseFloat(pool.price).toFixed(4);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
         onClick={onSelect}>
      {/* Pool Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W{pool.watchId}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Watch #{pool.watchId}</h3>
            <p className="text-sm text-gray-500">Fraction Pool</p>
          </div>
        </div>
        <ArrowsRightLeftIcon className="w-5 h-5 text-gray-400" />
      </div>

      {/* Pool Stats */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Price</span>
          <span className="font-medium text-gray-900">{price} USDC</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">TVL</span>
          <span className="font-medium text-gray-900">{totalValue} USDC</span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">Fraction Balance</p>
            <p className="font-medium text-gray-900">{parseFloat(pool.fractionBalance).toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">USDC Balance</p>
            <p className="font-medium text-gray-900">{parseFloat(pool.usdcBalance).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Action Hint */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
          <CurrencyDollarIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Trade & Add Liquidity</span>
        </div>
      </div>
    </div>
  );
}