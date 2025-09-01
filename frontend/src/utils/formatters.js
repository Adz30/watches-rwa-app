import { ethers } from 'ethers';

// Format large numbers with appropriate suffixes
export function formatNumber(value, decimals = 2) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  
  return num.toFixed(decimals);
}

// Format currency values
export function formatCurrency(value, currency = 'USDC', decimals = 2) {
  const formatted = formatNumber(value, decimals);
  return `${formatted} ${currency}`;
}

// Format percentage
export function formatPercentage(value, decimals = 2) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0.00%';
  return `${num.toFixed(decimals)}%`;
}

// Format wallet address
export function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Format token amount from wei
export function formatTokenAmount(amount, decimals = 18, displayDecimals = 4) {
  try {
    return parseFloat(ethers.formatUnits(amount, decimals)).toFixed(displayDecimals);
  } catch (error) {
    return '0.0000';
  }
}

// Parse token amount to wei
export function parseTokenAmount(amount, decimals = 18) {
  try {
    return ethers.parseUnits(amount.toString(), decimals);
  } catch (error) {
    return ethers.parseUnits('0', decimals);
  }
}

// Format time ago
export function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

// Calculate APY from interest rate
export function calculateAPY(interestRateBP, compoundingPeriods = 365) {
  const rate = parseFloat(interestRateBP) / 10000; // Convert basis points to decimal
  const apy = Math.pow(1 + rate / compoundingPeriods, compoundingPeriods) - 1;
  return (apy * 100).toFixed(2);
}

// Calculate loan-to-value ratio
export function calculateLTV(loanAmount, collateralValue) {
  const loan = parseFloat(loanAmount);
  const collateral = parseFloat(collateralValue);
  
  if (collateral === 0) return 0;
  return ((loan / collateral) * 100).toFixed(2);
}

// Format transaction hash for display
export function formatTxHash(hash, chars = 10) {
  if (!hash) return '';
  return `${hash.slice(0, chars)}...`;
}