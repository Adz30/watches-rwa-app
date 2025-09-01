import { useState } from 'react';
import { useSelector } from 'react-redux';
import TransactionStatus from '../UI/TransactionStatus';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function TransactionHistory({ title = "Recent Activity", maxItems = 5 }) {
  const [expanded, setExpanded] = useState(false);
  const lendingTransactions = useSelector((state) => state.lending.transactions.completed);
  const ammTransactions = useSelector((state) => state.amm.transactions.completed);
  
  // Combine and sort transactions by timestamp
  const allTransactions = [...lendingTransactions, ...ammTransactions]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const displayTransactions = expanded ? allTransactions : allTransactions.slice(0, maxItems);

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return '💰';
      case 'withdraw':
        return '💸';
      case 'borrow':
        return '🏦';
      case 'repay':
        return '✅';
      case 'swap':
        return '🔄';
      case 'add_liquidity':
        return '➕';
      case 'remove_liquidity':
        return '➖';
      default:
        return '📝';
    }
  };

  const formatTransactionData = (tx) => {
    switch (tx.type) {
      case 'deposit':
      case 'withdraw':
        return `${tx.data?.amount} ${tx.data?.token || 'USDC'}`;
      case 'borrow':
      case 'repay':
        return `NFT #${tx.data?.nftId}`;
      case 'swap':
        return `${tx.data?.from} → ${tx.data?.to}`;
      case 'add_liquidity':
      case 'remove_liquidity':
        return `Pool W${tx.data?.watchId || 'Unknown'}`;
      default:
        return 'Transaction';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {allTransactions.length > maxItems && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <span>{expanded ? 'Show Less' : 'Show All'}</span>
            {expanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {displayTransactions.map((tx, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getTransactionIcon(tx.type)}</span>
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {tx.type.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTransactionData(tx)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <TransactionStatus status="completed" hash={tx.hash} />
              <p className="text-xs text-gray-500 mt-1">
                {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'Recent'}
              </p>
            </div>
          </div>
        ))}
        {allTransactions.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No transactions yet</p>
        )}
      </div>
    </div>
  );
}