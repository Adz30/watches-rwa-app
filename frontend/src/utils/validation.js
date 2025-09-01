import { ethers } from 'ethers';

// Validate Ethereum address
export function isValidAddress(address) {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

// Validate amount input
export function isValidAmount(amount, maxAmount = null) {
  const num = parseFloat(amount);
  
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (maxAmount && num > parseFloat(maxAmount)) {
    return { valid: false, error: 'Amount exceeds available balance' };
  }
  
  return { valid: true };
}

// Validate slippage percentage
export function isValidSlippage(slippage) {
  const num = parseFloat(slippage);
  
  if (isNaN(num) || num < 0 || num > 50) {
    return { valid: false, error: 'Slippage must be between 0% and 50%' };
  }
  
  return { valid: true };
}

// Validate token amount format
export function isValidTokenAmount(amount, decimals = 18) {
  try {
    ethers.parseUnits(amount.toString(), decimals);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid token amount format' };
  }
}

// Check if user has sufficient balance
export function hasSufficientBalance(amount, balance) {
  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(balance);
  
  return !isNaN(amountNum) && !isNaN(balanceNum) && amountNum <= balanceNum;
}

// Validate NFT ID
export function isValidNFTId(nftId) {
  const id = parseInt(nftId);
  return !isNaN(id) && id > 0;
}

// Calculate minimum output with slippage
export function calculateMinOutput(amount, slippagePercent) {
  const amountNum = parseFloat(amount);
  const slippageNum = parseFloat(slippagePercent);
  
  if (isNaN(amountNum) || isNaN(slippageNum)) return '0';
  
  const minOutput = amountNum * (1 - slippageNum / 100);
  return minOutput.toString();
}

// Validate transaction parameters
export function validateTransactionParams(type, params) {
  switch (type) {
    case 'deposit':
    case 'withdraw':
      return isValidAmount(params.amount, params.maxAmount);
    
    case 'swap':
      const amountValidation = isValidAmount(params.amount, params.maxAmount);
      if (!amountValidation.valid) return amountValidation;
      
      const slippageValidation = isValidSlippage(params.slippage);
      if (!slippageValidation.valid) return slippageValidation;
      
      return { valid: true };
    
    case 'borrow':
    case 'repay':
      if (!isValidNFTId(params.nftId)) {
        return { valid: false, error: 'Invalid NFT ID' };
      }
      return { valid: true };
    
    default:
      return { valid: false, error: 'Unknown transaction type' };
  }
}