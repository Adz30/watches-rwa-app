import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNFT } from '../hooks/useNFT';
import { PhotoIcon, PlusIcon } from '@heroicons/react/24/outline';
import NFTCard from '../components/NFT/NFTCard';

export default function NFTsPage() {
  const { address, isConnected } = useAccount();
  const { nftState, fetchUserNFTs } = useNFT();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNFTs = async () => {
      if (isConnected && address) {
        try {
          await fetchUserNFTs();
        } catch (error) {
          console.error('Error loading NFTs:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadNFTs();
  }, [isConnected, address, fetchUserNFTs]);

  const handleNFTAction = async (action, tokenId) => {
    console.log(`Action: ${action} on NFT #${tokenId}`);
    // Actions will be handled by the respective components
    if (action === 'borrow') {
      // Redirect to lending page with NFT selected
      window.location.href = `/lending?nft=${tokenId}`;
    } else if (action === 'fractionalize') {
      // Handle fractionalization
      alert('Fractionalization feature coming soon!');
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Connect Wallet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Connect your wallet to view your NFT collection
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your NFT Collection</h1>
            <p className="text-gray-600">
              Manage your luxury watch NFTs - use as collateral or fractionalize for trading
            </p>
          </div>
          <button
            onClick={fetchUserNFTs}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* NFT Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PhotoIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total NFTs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {nftState.userNFTs.data.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available</p>
              <p className="text-2xl font-semibold text-gray-900">
                {nftState.userNFTs.data.filter(nft => {
                  const status = nftState.collateralStatus.data[nft.tokenId];
                  return !status?.isCollateral || status?.repaid;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">L</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">As Collateral</p>
              <p className="text-2xl font-semibold text-gray-900">
                {nftState.userNFTs.data.filter(nft => {
                  const status = nftState.collateralStatus.data[nft.tokenId];
                  return status?.isCollateral && !status?.repaid;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">F</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Fractionalized</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Object.values(nftState.fractionalized.data).filter(info => info.isFramentalized).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Collection */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Collection</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse"></div>
            ))}
          </div>
        ) : nftState.userNFTs.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nftState.userNFTs.data.map((nft) => (
              <NFTCard
                key={nft.tokenId}
                tokenId={nft.tokenId}
                showActions={true}
                onAction={handleNFTAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No NFTs Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't own any watch NFTs yet. Contact the platform to mint your first NFT.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">What would you like to do?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/lending"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <CurrencyDollarIcon className="w-8 h-8 text-blue-600 group-hover:text-blue-700" />
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-blue-900">Use as Collateral</h3>
              <p className="text-sm text-gray-600">Borrow USDC against your NFTs</p>
            </div>
          </Link>
          
          <button
            onClick={() => alert('Fractionalization feature coming soon!')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
          >
            <PlusIcon className="w-8 h-8 text-purple-600 group-hover:text-purple-700" />
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-purple-900">Fractionalize</h3>
              <p className="text-sm text-gray-600">Split NFT into tradeable tokens</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}