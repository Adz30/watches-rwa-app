import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useLending } from '../../hooks/useLending';
import { useNFT } from '../../hooks/useNFT';
import { CurrencyDollarIcon, BanknotesIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import NFTCard from '../NFT/NFTCard';
import LenderPanel from './LenderPanel';
import BorrowerPanel from './BorrowerPanel';

export default function LendingDashboard() {
  const { address, isConnected } = useAccount();
  const { lendingState, fetchPoolInfo, fetchLenderInfo } = useLending();
  const { nftState, fetchUserNFTs } = useNFT();
  const [activeTab, setActiveTab] = useState('lender');

  useEffect(() => {
    if (isConnected && address) {
      fetchPoolInfo();
      fetchLenderInfo();
      fetchUserNFTs();
    }
  }, [isConnected, address, fetchPoolInfo, fetchLenderInfo, fetchUserNFTs]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Connect Wallet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Connect your wallet to access the lending platform
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'lender', name: 'Lender', icon: BanknotesIcon },
    { id: 'borrower', name: 'Borrower', icon: CurrencyDollarIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">NFT Collateral Lending</h1>
        <p className="text-gray-600">
          Lend USDC to earn interest or use your NFTs as collateral to borrow
        </p>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Pool USDC</p>
              <p className="text-2xl font-semibold text-gray-900">
                {parseFloat(lendingState.poolInfo.totalPoolUSDC).toLocaleString()} USDC
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total LP Shares</p>
              <p className="text-2xl font-semibold text-gray-900">
                {parseFloat(lendingState.poolInfo.totalShares).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Your Position</p>
              <p className="text-2xl font-semibold text-gray-900">
                {parseFloat(lendingState.lenderInfo.usdcValue).toFixed(2)} USDC
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
          {activeTab === 'lender' && <LenderPanel />}
          {activeTab === 'borrower' && <BorrowerPanel />}
          {activeTab === 'analytics' && (
            <div className="text-center py-8">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Coming Soon</h3>
              <p className="mt-1 text-sm text-gray-500">
                Detailed analytics and insights will be available here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}