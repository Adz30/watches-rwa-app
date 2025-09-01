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
  ChartBarIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import StatsCard from '../components/Dashboard/StatsCard';
import QuickActionCard from '../components/Dashboard/QuickActionCard';
import TransactionHistory from '../components/Dashboard/TransactionHistory';

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
      title: 'Total Portfolio Value',
      value: `${(parseFloat(lendingState.lenderInfo.usdcValue) + parseFloat(userState.balances.usdc)).toFixed(2)} USDC`,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Loans',
      value: lendingState.loans.active.length,
      icon: ChartBarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'LP Positions',
      value: ammState.userPositions.data.length,
      icon: ArrowsRightLeftIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Owned NFTs',
      value: nftState.userNFTs.data.length,
      icon: PhotoIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const quickActions = [
    {
      title: 'Lend USDC',
      description: 'Deposit USDC to earn interest from borrowers',
      href: '/lending',
      icon: CurrencyDollarIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Borrow Against NFT',
      description: 'Use your NFTs as collateral to borrow USDC',
      href: '/lending',
      icon: PhotoIcon,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      title: 'Trade Fractions',
      description: 'Swap between USDC and fractionalized watch tokens',
      href: '/amm',
      icon: ArrowsRightLeftIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Provide Liquidity',
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
          return <StatsCard key={stat.title} {...stat} />;
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            return <QuickActionCard key={action.title} {...action} />;
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <TransactionHistory title="Recent Activity" maxItems={8} />
    </div>
  );
}