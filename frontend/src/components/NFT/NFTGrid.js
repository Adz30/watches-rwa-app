import { useState } from 'react';
import NFTCard from './NFTCard';
import { PhotoIcon } from '@heroicons/react/24/outline';

export default function NFTGrid({ 
  nfts, 
  loading = false, 
  showActions = true, 
  onAction,
  emptyMessage = "No NFTs found",
  emptyDescription = "You don't have any NFTs in this category"
}) {
  const [filter, setFilter] = useState('all');

  const filteredNFTs = nfts.filter(nft => {
    if (filter === 'all') return true;
    if (filter === 'available') {
      // NFTs that are not used as collateral or fractionalized
      return !nft.isCollateral && !nft.isFramentalized;
    }
    if (filter === 'collateral') {
      return nft.isCollateral;
    }
    if (filter === 'fractionalized') {
      return nft.isFramentalized;
    }
    return true;
  });

  const filterOptions = [
    { value: 'all', label: 'All NFTs', count: nfts.length },
    { value: 'available', label: 'Available', count: nfts.filter(nft => !nft.isCollateral && !nft.isFramentalized).length },
    { value: 'collateral', label: 'Collateral', count: nfts.filter(nft => nft.isCollateral).length },
    { value: 'fractionalized', label: 'Fractionalized', count: nfts.filter(nft => nft.isFramentalized).length },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Filter skeleton */}
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {nfts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      )}

      {/* NFT Grid */}
      {filteredNFTs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNFTs.map((nft) => (
            <NFTCard
              key={nft.tokenId}
              tokenId={nft.tokenId}
              showActions={showActions}
              onAction={onAction}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</h3>
          <p className="mt-1 text-sm text-gray-500">{emptyDescription}</p>
        </div>
      )}
    </div>
  );
}