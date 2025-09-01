import { useState, useEffect } from 'react';
import { useNFT } from '../../hooks/useNFT';
import { CreditCardIcon, CurrencyDollarIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function NFTCard({ tokenId, showActions = true, onAction }) {
  const { nftState, getNFTInfo } = useNFT();
  const [loading, setLoading] = useState(true);
  
  const metadata = nftState.nftMetadata.data[tokenId];
  const collateralStatus = nftState.collateralStatus.data[tokenId];
  const fractionalizedInfo = nftState.fractionalized.data[tokenId];

  useEffect(() => {
    const loadNFTInfo = async () => {
      try {
        await getNFTInfo(tokenId);
      } catch (error) {
        console.error('Error loading NFT info:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!metadata) {
      loadNFTInfo();
    } else {
      setLoading(false);
    }
  }, [tokenId, metadata, getNFTInfo]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-300"></div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (collateralStatus?.isCollateral && !collateralStatus?.repaid) {
      return (
        <div className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
          <LockClosedIcon className="w-3 h-3" />
          <span>Collateral</span>
        </div>
      );
    }
    
    if (fractionalizedInfo?.isFramentalized) {
      return (
        <div className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
          <CurrencyDollarIcon className="w-3 h-3" />
          <span>Fractionalized</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
        <span>Available</span>
      </div>
    );
  };

  const getActionButtons = () => {
    if (!showActions) return null;

    const buttons = [];

    if (collateralStatus?.isCollateral && !collateralStatus?.repaid) {
      buttons.push(
        <button
          key="repay"
          onClick={() => onAction?.('repay', tokenId)}
          className="flex-1 bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          Repay Loan
        </button>
      );
    } else if (!fractionalizedInfo?.isFramentalized) {
      buttons.push(
        <button
          key="borrow"
          onClick={() => onAction?.('borrow', tokenId)}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Use as Collateral
        </button>
      );
      buttons.push(
        <button
          key="fractionalize"
          onClick={() => onAction?.('fractionalize', tokenId)}
          className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Fractionalize
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* NFT Image */}
      <div className="relative h-48 bg-gray-100">
        <img
          src={metadata?.image || 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt={metadata?.name || `NFT #${tokenId}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* NFT Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {metadata?.name || `Watch #${tokenId}`}
          </h3>
          <span className="text-sm text-gray-500">#{tokenId}</span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {metadata?.description || 'A premium luxury watch NFT'}
        </p>

        {/* Attributes */}
        {metadata?.attributes && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {metadata.attributes.slice(0, 4).map((attr, index) => (
              <div key={index} className="text-xs">
                <span className="text-gray-500">{attr.trait_type}:</span>
                <span className="ml-1 font-medium">{attr.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Loan/Collateral Info */}
        {collateralStatus?.isCollateral && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2 mb-1">
              <LockClosedIcon className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {collateralStatus.repaid ? 'Loan Repaid' : 'Active Loan'}
              </span>
            </div>
            <div className="text-xs text-orange-700">
              Borrowed: {parseFloat(collateralStatus.borrowedAmount).toFixed(2)} USDC
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex space-x-2">
            {getActionButtons()}
          </div>
        )}
      </div>
    </div>
  );
}