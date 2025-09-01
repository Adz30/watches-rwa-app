import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNFT } from '../hooks/useNFT';
import { PhotoIcon, PlusIcon } from '@heroicons/react/24/outline';
import NFTGrid from '../components/NFT/NFTGrid';
import StatsCard from '../components/Dashboard/StatsCard';
import QuickActionCard from '../components/Dashboard/QuickActionCard';

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
        <StatsCard
          title="Total NFTs"
          value={nftState.userNFTs.data.length}
          icon={PhotoIcon}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Available"
          value={nftState.userNFTs.data.filter(nft => {
            const status = nftState.collateralStatus.data[nft.tokenId];
            return !status?.isCollateral || status?.repaid;
          }).length}
          icon={CurrencyDollarIcon}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="As Collateral"
          value={nftState.userNFTs.data.filter(nft => {
            const status = nftState.collateralStatus.data[nft.tokenId];
            return status?.isCollateral && !status?.repaid;
          }).length}
          icon={() => <span className="text-orange-600 font-bold text-lg">L</span>}
          }
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatsCard
          title="Fractionalized"
          value={Object.values(nftState.fractionalized.data).filter(info => info.isFramentalized).length}
          icon={() => <span className="text-purple-600 font-bold text-lg">F</span>}
          }
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* NFT Collection */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Collection</h2>
        
        <NFTGrid
          nfts={nftState.userNFTs.data}
          loading={loading}
          showActions={true}
          onAction={handleNFTAction}
          emptyMessage="No NFTs Found"
          emptyDescription="You don't own any watch NFTs yet. Contact the platform to mint your first NFT."
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">What would you like to do?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickActionCard
            title="Use as Collateral"
            description="Borrow USDC against your NFTs"
            href="/lending"
            icon={CurrencyDollarIcon}
            color="bg-blue-600 hover:bg-blue-700"
          />
          
          <QuickActionCard
            title="Fractionalize"
            description="Split NFT into tradeable tokens"
            icon={PlusIcon}
            color="bg-purple-600 hover:bg-purple-700"
            onClick={() => alert('Fractionalization feature coming soon!')}
          />
        </div>
      </div>
    </div>
  );
}