// Network configurations
export const NETWORKS = {
  LOCALHOST: {
    id: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: null,
  },
  MAINNET: {
    id: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://etherscan.io',
  },
};

// Token configurations
export const TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 18, // Note: Your mock USDC uses 18 decimals
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

// Contract interaction constants
export const TRANSACTION_TYPES = {
  APPROVE: 'approve',
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  BORROW: 'borrow',
  REPAY: 'repay',
  SWAP: 'swap',
  ADD_LIQUIDITY: 'add_liquidity',
  REMOVE_LIQUIDITY: 'remove_liquidity',
  FRACTIONALIZE: 'fractionalize',
  REDEEM: 'redeem',
};

// UI constants
export const SLIPPAGE_OPTIONS = ['0.1', '0.5', '1.0', '3.0'];

export const DEFAULT_SLIPPAGE = '0.5';

// Lending constants
export const COLLATERAL_RATIO = 80; // 80% LTV
export const INTEREST_RATE = 2; // 2% interest

// AMM constants
export const DEFAULT_FEE_BPS = 30; // 0.3% fee

// NFT metadata constants
export const DEFAULT_NFT_IMAGE = 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400';

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  INVALID_AMOUNT: 'Please enter a valid amount',
  SLIPPAGE_TOO_HIGH: 'Price impact too high. Consider reducing your amount.',
  NFT_NOT_OWNED: 'You do not own this NFT',
  LOAN_ALREADY_EXISTS: 'This NFT is already used as collateral',
  LOAN_NOT_FOUND: 'No active loan found for this NFT',
};

// Success messages
export const SUCCESS_MESSAGES = {
  DEPOSIT_SUCCESS: 'USDC deposited successfully',
  WITHDRAW_SUCCESS: 'USDC withdrawn successfully',
  LOAN_TAKEN: 'Loan taken successfully',
  LOAN_REPAID: 'Loan repaid successfully',
  SWAP_SUCCESS: 'Swap completed successfully',
  LIQUIDITY_ADDED: 'Liquidity added successfully',
  LIQUIDITY_REMOVED: 'Liquidity removed successfully',
};

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
};