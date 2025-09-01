# WatchDeFi - NFT Collateral Lending & AMM Platform

A comprehensive DeFi platform for luxury watch NFTs, featuring collateral-based lending and fractionalized token trading through an Automated Market Maker (AMM).

---

## Features

### NFT Collateral Lending
- **Lenders**: Deposit USDC to earn interest from borrowers
- **Borrowers**: Use watch NFTs as collateral to borrow USDC
- **Interest System**: 2% interest rate with 80% loan-to-value ratio
- **Real-time Tracking**: Monitor active loans and lending positions

### Watch Fraction AMM
- **Fractionalization**: Split watch NFTs into tradeable ERC20 tokens
- **Liquidity Pools**: Provide liquidity for USDC/Fraction token pairs
- **Trading**: Swap between USDC and fractionalized watch tokens
- **Oracle Pricing**: Dynamic pricing based on external price feeds

### Frontend Features
- **Wallet Integration**: MetaMask connection with Wagmi
- **State Management**: Redux for comprehensive state handling
- **Real-time Updates**: Live balance and transaction tracking
- **Responsive Design**: Mobile-first Tailwind CSS design
- **Transaction History**: Complete audit trail of all operations

---

## Tech Stack

### Smart Contracts
- **Hardhat**: Development environment and testing
- **Solidity 0.8.23**: Smart contract language
- **OpenZeppelin**: Security-audited contract libraries
- **Ethers.js**: Blockchain interaction library

### Frontend
- **Next.js 15**: React framework with Pages Router
- **React 19**: UI library
- **Wagmi**: Ethereum wallet connection
- **Redux Toolkit**: State management
- **Tailwind CSS**: Utility-first styling
- **Heroicons**: Icon library

---

## Getting Started

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd backend
npm install
```

### 2. Start Local Blockchain

```bash
cd backend
npx hardhat node
```

### 3. Deploy Contracts

```bash
cd backend
npx hardhat run scripts/Deploy.js --network localhost
```

### 4. Configure Frontend

1. Start the frontend development server:
```bash
cd frontend
npm run dev
```

2. Open http://localhost:3000 and navigate to the **Setup** page
3. Enter your deployed contract addresses
4. Save the configuration

### 5. Connect Wallet

1. Add localhost network to MetaMask:
   - Network Name: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import test accounts from Hardhat node output
3. Connect wallet through the app interface

---

## Usage Guide

### NFT Collateral Lending

**As a Lender:**
1. Navigate to **Lending** → **Lender** tab
2. Deposit USDC to the lending pool
3. Earn interest from borrowers (2% per loan)
4. Withdraw your USDC + earned interest anytime

**As a Borrower:**
1. Navigate to **Lending** → **Borrower** tab
2. Select an NFT to use as collateral
3. Borrow up to 80% of the NFT's oracle value
4. Repay the loan + 2% interest to reclaim your NFT

### AMM Trading

**Providing Liquidity:**
1. Navigate to **AMM** → **Liquidity** tab
2. Select a pool (or create one for a fractionalized NFT)
3. Add both USDC and fraction tokens proportionally
4. Earn trading fees from swaps

**Trading:**
1. Navigate to **AMM** → **Swap** tab
2. Select input/output tokens
3. Enter amount and review price impact
4. Execute swap with slippage protection

### NFT Management

1. Navigate to **NFTs** page
2. View all your watch NFTs with status indicators
3. Use NFTs as collateral or fractionalize them
4. Track which NFTs are locked in loans or fractionalized

---

## Architecture

### Smart Contracts

```
contracts/
├── Watch/
│   ├── WatchRegistry.sol          # NFT registry
│   ├── WatchFraction.sol          # Fractionalized tokens
│   └── WatchFractionalizer.sol    # Fractionalization logic
├── Marketplace/
│   ├── NFTCollateralLending.sol   # Lending protocol
│   └── AMM.sol                    # Automated Market Maker
└── Token/
    └── Token.sol                  # ERC20 implementation
```

### Frontend Structure

```
src/
├── components/
│   ├── Layout/           # Header, navigation
│   ├── Lending/          # Lending UI components
│   ├── AMM/              # AMM UI components
│   ├── NFT/              # NFT display components
│   ├── Dashboard/        # Dashboard widgets
│   ├── UI/               # Reusable UI components
│   └── Setup/            # Configuration components
├── hooks/                # Custom React hooks
├── store/                # Redux store and slices
├── utils/                # Utility functions
├── lib/                  # Web3 configuration
└── pages/                # Next.js pages
```

### State Management

**Redux Slices:**
- `userSlice`: Wallet connection, balances, transactions
- `lendingSlice`: Pool info, lender positions, loans
- `ammSlice`: Pool data, liquidity positions, swaps
- `nftSlice`: NFT metadata, collateral status, fractionalization

---

## Key Features

### Security
- **Reentrancy Protection**: All state-changing functions protected
- **Access Controls**: Proper permission management
- **Input Validation**: Comprehensive parameter checking
- **Safe Math**: Overflow protection with Solidity 0.8+

### User Experience
- **Real-time Updates**: Automatic balance and position refreshes
- **Transaction Tracking**: Complete transaction history
- **Error Handling**: Graceful error messages and recovery
- **Responsive Design**: Works on all device sizes

### Developer Experience
- **Modular Architecture**: Clean separation of concerns
- **Type Safety**: Comprehensive error handling
- **Testing Suite**: Full test coverage for contracts
- **Documentation**: Inline code documentation

---

## Testing

**Run Contract Tests:**
```bash
cd backend
npx hardhat test
```

**Test Coverage:**
- Token functionality (ERC20 compliance)
- NFT registry operations
- Fractionalization process
- Lending protocol (deposit, withdraw, borrow, repay)
- AMM operations (liquidity, swaps, pricing)

---

## Deployment

### Local Development
1. Follow the "Getting Started" section above
2. Use the provided Hardhat network configuration
3. Deploy contracts with the included scripts

### Production Deployment
1. Update `hardhat.config.js` with mainnet/testnet configuration
2. Set up environment variables for private keys
3. Deploy contracts to target network
4. Update frontend contract addresses
5. Deploy frontend to hosting platform

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

---

## License

MIT License - see LICENSE file for details

---

## Support

For questions or issues:
1. Check the documentation above
2. Review the test files for usage examples
3. Open an issue on GitHub
4. Join our community Discord

---

**Built with ❤️ for the luxury watch and DeFi communities**
npm install

###3. Run the project
Deploy contracts (Hardhat):
cd backend
npx hardhat run scripts/Deploy.js --network localhost

Run frontend:
cd ../frontend
npm run dev
Then open http://localhost:3000 in your browser.


