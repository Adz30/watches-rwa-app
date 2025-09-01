import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAMM } from '../../hooks/useAMM';
import { CurrencyDollarIcon, ArrowsRightLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import PoolCard from './PoolCard';
import SwapPanel from './SwapPanel';
import LiquidityPanel from './LiquidityPanel';

export default function AMMDashboard() {
  const { address, isConnected } = useAccount();
  const { ammState, fetchPools, fetchUserPositions } = useAMM();
  const [activeTab, setActiveTab] = useState('pools');
  const [selectedPool, setSelectedPool] = useState(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchPools();
      fetchUserPositions();
    }
  }, [isConnected, address, fetchPools, fetchUserPositions]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <ArrowsRightLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Connect Wallet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Connect your wallet to access the AMM
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'pools', name: 'Pools', icon: CurrencyDollarIcon },
    { id: 'swap', name: 'Swap', icon: ArrowsRightLeftIcon },
    { id: 'liquidity', name: 'Liquidity', icon: PlusIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Watch Fraction AMM</h1>
        <p className="text-gray-600">
          Trade fractionalized watch tokens and provide liquidity to earn fees
        </p>
      </div>

      {/* Pool Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Pools</p>
              <p className="text-2xl font-semibold text-gray-900">
                {ammState.pools.data.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowsRightLeftIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value Locked</p>
              <p className="text-2xl font-semibold text-gray-900">
                {ammState.pools.data.reduce((total, pool) => 
                  total + parseFloat(pool.usdcBalance) * 2, 0
                ).toLocaleString()} USDC
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PlusIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Your Positions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {ammState.userPositions.data.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'pools' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Available Pools</h3>
                <button
                  onClick={fetchPools}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Refresh
                </button>
              </div>
              
              {ammState.pools.loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse"></div>
                  ))}
                </div>
              ) : ammState.pools.data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ammState.pools.data.map((pool) => (
                    <PoolCard
                      key={pool.address}
                      pool={pool}
                      onSelect={() => {
                        setSelectedPool(pool);
                        setActiveTab('swap');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Pools Available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No AMM pools have been created yet
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'swap' && (
            <SwapPanel selectedPool={selectedPool} onPoolSelect={setSelectedPool} />
          )}

          {activeTab === 'liquidity' && (
            <LiquidityPanel selectedPool={selectedPool} onPoolSelect={setSelectedPool} />
          )}
        </div>
      </div>

      {/* User Positions */}
      {ammState.userPositions.data.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Liquidity Positions</h3>
          <div className="space-y-3">
            {ammState.userPositions.data.map((position, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">W{position.watchId}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Watch #{position.watchId} Pool</p>
                    <p className="text-sm text-gray-500">{position.sharePercentage}% of pool</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{parseFloat(position.shares).toFixed(2)} shares</p>
                  <button
                    onClick={() => {
                      const pool = ammState.pools.data.find(p => p.watchId === position.watchId);
                      setSelectedPool(pool);
                      setActiveTab('liquidity');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}