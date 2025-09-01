import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLending } from '../../hooks/useLending';
import { useNFT } from '../../hooks/useNFT';
import { LockClosedIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import NFTCard from '../NFT/NFTCard';

export default function BorrowerPanel() {
  const { depositNFTAndBorrow, repayLoan } = useLending();
  const { nftState } = useNFT();
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const userNFTs = nftState.userNFTs.data;
  const activeLoans = useSelector((state) => 
    state.lending.loans.active.filter(loan => !loan.repaid)
  );
  const repaidLoans = useSelector((state) => 
    state.lending.loans.repaid
  );

  const handleNFTAction = async (action, tokenId) => {
    setLoading(true);
    setSelectedAction({ action, tokenId });

    try {
      if (action === 'borrow') {
        await depositNFTAndBorrow(tokenId);
      } else if (action === 'repay') {
        await repayLoan(tokenId);
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
      alert(`${action} failed: ` + error.message);
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  const availableNFTs = userNFTs.filter(nft => {
    const collateralStatus = nftState.collateralStatus.data[nft.tokenId];
    return !collateralStatus?.isCollateral || collateralStatus?.repaid;
  });

  const collateralNFTs = userNFTs.filter(nft => {
    const collateralStatus = nftState.collateralStatus.data[nft.tokenId];
    return collateralStatus?.isCollateral && !collateralStatus?.repaid;
  });

  return (
    <div className="space-y-6">
      {/* Active Loans Summary */}
      {activeLoans.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <LockClosedIcon className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-800">Active Loans</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLoans.map((loan) => (
              <div key={loan.nftId} className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">NFT #{loan.nftId}</span>
                  <span className="text-sm text-orange-600 font-medium">Active</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Borrowed:</span>
                    <span className="font-medium">{parseFloat(loan.borrowedAmount).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest (2%):</span>
                    <span className="font-medium">{(parseFloat(loan.borrowedAmount) * 0.02).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-gray-900 font-medium">Total to Repay:</span>
                    <span className="font-bold">{(parseFloat(loan.borrowedAmount) * 1.02).toFixed(2)} USDC</span>
                  </div>
                </div>
                <button
                  onClick={() => handleNFTAction('repay', loan.nftId)}
                  disabled={loading && selectedAction?.tokenId === loan.nftId}
                  className="w-full mt-3 bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  {loading && selectedAction?.tokenId === loan.nftId ? 'Repaying...' : 'Repay Loan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available NFTs for Collateral */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available NFTs for Collateral</h3>
        {availableNFTs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableNFTs.map((nft) => (
              <NFTCard
                key={nft.tokenId}
                tokenId={nft.tokenId}
                showActions={true}
                onAction={handleNFTAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Available NFTs</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any NFTs available to use as collateral
            </p>
          </div>
        )}
      </div>

      {/* Collateral NFTs */}
      {collateralNFTs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">NFTs Used as Collateral</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collateralNFTs.map((nft) => (
              <NFTCard
                key={nft.tokenId}
                tokenId={nft.tokenId}
                showActions={true}
                onAction={handleNFTAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loan History */}
      {repaidLoans.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan History</h3>
          <div className="space-y-3">
            {repaidLoans.map((loan, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">NFT #{loan.nftId}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {parseFloat(loan.borrowedAmount).toFixed(2)} USDC
                  </p>
                  <p className="text-xs text-green-600">Repaid</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}