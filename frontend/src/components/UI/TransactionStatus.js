import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function TransactionStatus({ status, hash, className = '' }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="capitalize">{status}</span>
      {hash && (
        <a
          href={`https://etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline hover:no-underline"
        >
          View
        </a>
      )}
    </div>
  );
}