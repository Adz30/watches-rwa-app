// Contract addresses - Update these with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  NFT_COLLATERAL_LENDING: "0x...", // Update after deployment
  AMM_FACTORY: "0x...", // Update after deployment
  WATCH_REGISTRY: "0x...", // Update after deployment
  USDC: "0x...", // Update after deployment
  MOCK_ORACLE: "0x...", // Update after deployment
};

// Contract ABIs
export const NFT_COLLATERAL_LENDING_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 shareAmount) external",
  "function depositNFTAndBorrow(uint256 nftId) external",
  "function repayLoan(uint256 nftId) external",
  "function getPoolInfo() external view returns (uint256 totalPoolUSDC, uint256 totalShares)",
  "function getLender(address user) external view returns (uint256 shares, uint256 usdcValue)",
  "function getLoan(uint256 nftId) external view returns (address borrower, uint256 borrowedAmount, bool repaid)",
  "function totalPoolUSDC() external view returns (uint256)",
  "function totalShares() external view returns (uint256)",
  "function collateralRatioBP() external view returns (uint256)",
  "function interestRateBP() external view returns (uint256)",
  "event Deposit(address indexed lender, uint256 amount, uint256 shares)",
  "event Withdraw(address indexed lender, uint256 amount, uint256 shares)",
  "event LoanTaken(address indexed borrower, uint256 nftId, uint256 amount)",
  "event LoanRepaid(address indexed borrower, uint256 nftId, uint256 amount)"
];

export const AMM_ABI = [
  "function addLiquidity(uint256 fractionAmount, uint256 usdcAmount) external",
  "function removeLiquidity(uint256 shareAmount) external",
  "function swapUSDCForFraction(uint256 usdcIn, uint256 minFractionOut) external returns (uint256)",
  "function swapFractionForUSDC(uint256 fractionIn, uint256 minUsdcOut) external returns (uint256)",
  "function quoteFractionForUSDC(uint256 fractionIn) external view returns (uint256 usdcOutNoFee, uint256 priceUsed)",
  "function quoteUSDCForFraction(uint256 usdcIn) external view returns (uint256 fractionOutNoFee, uint256 priceUsed)",
  "function poolPrice() external view returns (uint256)",
  "function fractionBalance() external view returns (uint256)",
  "function usdcBalance() external view returns (uint256)",
  "function totalShares() external view returns (uint256)",
  "function shares(address user) external view returns (uint256)",
  "function watchId() external view returns (uint256)",
  "function fractionToken() external view returns (address)",
  "function usdcToken() external view returns (address)",
  "event LiquidityAdded(address indexed provider, uint256 fractionIn, uint256 usdcIn, uint256 sharesMinted)",
  "event LiquidityRemoved(address indexed provider, uint256 fractionOut, uint256 usdcOut, uint256 sharesBurned)",
  "event Swap(address indexed user, address tokenGive, uint256 amountGive, address tokenGet, uint256 amountGet, uint256 priceUsed, uint256 timestamp)"
];

export const AMM_FACTORY_ABI = [
  "function createPool(uint256 watchId, address fractionToken, uint256 feeBps, address feeRecipient) external returns (address)",
  "function getPoolByWatch(uint256 watchId) external view returns (address)",
  "function getPoolByFraction(address fractionToken) external view returns (address)",
  "function watchIdToPool(uint256 watchId) external view returns (address)",
  "function fractionToPool(address fractionToken) external view returns (address)",
  "event PoolCreated(uint256 indexed watchId, address indexed fractionToken, address pool)"
];

export const WATCH_REGISTRY_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function balanceOf(address owner) external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"
];

export const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const WATCH_FRACTION_ABI = [
  ...ERC20_ABI,
  "function fractionalizer() external view returns (address)",
  "function burnFromUser(address user, uint256 amount) external"
];

export const FRACTIONALIZER_FACTORY_ABI = [
  "function fractionalize(uint256 watchId, uint256 totalShares) external returns (address)",
  "function redeem(uint256 watchId) external",
  "function getFractionalizer(uint256 watchId) external view returns (address)",
  "function getAllFractionalizers() external view returns (address[])",
  "function fractionalizersById(uint256 watchId) external view returns (address)",
  "event FractionalizerCreated(uint256 indexed watchId, address fractionalizer, address owner)",
  "event Redeemed(uint256 indexed watchId, address redeemer)"
];