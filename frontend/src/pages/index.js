import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLending } from '../hooks/useLending';
import { useAMM } from '../hooks/useAMM';
import { useNFT } from '../hooks/useNFT';
import { 
  CurrencyDollarIcon, 
  ArrowsRightLeftIcon, 
  PhotoIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { fetchPoolInfo, fetchLenderInfo } = useLending();
  const { fetchPools, fetchUserPositions } = useAMM();
  const { fetchUserNFTs } = useNFT();
  
  const lendingState = useSelector((state) => state.lending);
  const ammState = useSelector((state) => state.amm);
  const nftState = useSelector((state) => state.nft);
  const userState = useSelector((state) => state.user);

  useEffect(() => {
    if (isConnected && address) {
      fetchPoolInfo();
      fetchLenderInfo();
      fetchPools();
      fetchUserPositions();
      fetchUserNFTs();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WatchDeFi</h1>
          <p className="text-gray-600 mb-6">
            The premier platform for luxury watch NFT lending and fractionalized trading
          </p>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Your Wallet</h3>
            <p className="text-gray-600 mb-4">
              Connect your wallet to start lending, borrowing, and trading fractionalized watch NFTs
            </p>
          </div>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    {
      name: 'Total Portfolio Value',
      value: `${(parseFloat(lendingState.lenderInfo.usdcValue) + parseFloat(userState.balances.usdc)).toFixed(2)} USDC`,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Active Loans',
      value: lendingState.loans.active.length,
      icon: ChartBarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      name: 'LP Positions',
      value: ammState.userPositions.data.length,
      icon: ArrowsRightLeftIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Owned NFTs',
      value: nftState.userNFTs.data.length,
      icon: PhotoIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const quickActions = [
    {
      name: 'Lend USDC',
      description: 'Deposit USDC to earn interest from borrowers',
      href: '/lending',
      icon: CurrencyDollarIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Borrow Against NFT',
      description: 'Use your NFTs as collateral to borrow USDC',
      href: '/lending',
      icon: PhotoIcon,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      name: 'Trade Fractions',
      description: 'Swap between USDC and fractionalized watch tokens',
      href: '/amm',
      icon: ArrowsRightLeftIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Provide Liquidity',
      description: 'Add liquidity to AMM pools and earn trading fees',
      href: '/amm',
      icon: PlusIcon,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white p-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to WatchDeFi</h1>
        <p className="text-blue-100 mb-4">
          Your gateway to luxury watch NFT lending and fractionalized trading
        </p>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Network: Localhost</span>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.href}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${action.color} transition-colors`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.name}
                    </h3>
                    <p className="text-gray-600 mt-1">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lending Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Lending Activity</h3>
          <div className="space-y-3">
            {lendingState.transactions.completed.slice(0, 3).map((tx, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.type === 'deposit' ? 'bg-green-500' : 
                    tx.type === 'borrow' ? 'bg-orange-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium capitalize">{tx.type}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {tx.data?.amount} {tx.data?.token || 'USDC'}
                </span>
              </div>
            ))}
            {lendingState.transactions.completed.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Recent AMM Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent AMM Activity</h3>
          <div className="space-y-3">
            {ammState.transactions.completed.slice(0, 3).map((tx, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.type === 'swap' ? 'bg-blue-500' : 
                    tx.type === 'add_liquidity' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium capitalize">{tx.type.replace('_', ' ')}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {tx.data?.from} → {tx.data?.to}
                </span>
              </div>
            ))}
            {ammState.transactions.completed.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}