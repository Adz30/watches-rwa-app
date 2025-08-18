# Hardhat + Next.js + Wagmi Starter

A starter project combining **Hardhat**, **Next.js**, and **Wagmi** for building Ethereum dApps. This setup includes a smart contract backend and a React frontend ready to connect to wallets and the blockchain.

---

## Features

- Ethereum smart contract development with **Hardhat**
- Frontend built with **Next.js** and **React**
- Wallet connection using **Wagmi**
- Example ERC20 token contract
- Scripts for deploying contracts
- Preconfigured testing setup

---

## Tech Stack

- **Backend:** Hardhat, Solidity, Ethers.js
- **Frontend:** Next.js, React, Wagmi, Tailwind CSS
- **Testing:** Mocha, Chai

---

## Getting Started

### 1. Clone the repository
git clone https://github.com/Adz30/hardhat-next-wagmi-starter.git
cd hardhat-next-wagmi-starter

###2. Install dependencies

Backend:
cd backend
npm install

Frontend:
cd ../frontend
npm install

###3. Run the project
Deploy contracts (Hardhat):
cd backend
npx hardhat run scripts/Deploy.js --network localhost

Run frontend:
cd ../frontend
npm run dev
Then open http://localhost:3000 in your browser.


