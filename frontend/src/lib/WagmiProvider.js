"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, localhost } from "wagmi/chains";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

// 1️⃣ Define chains
const chains = [localhost, mainnet];

// 2️⃣ Get wallet connectors from RainbowKit
const { connectors } = getDefaultWallets({
  appName: "Local Wallet DApp",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Can be any string for local dev
  chains,
});

// 3️⃣ Create Wagmi config
const config = createConfig({
  chains,
  connectors,
  transports: {
    [localhost.id]: http("http://127.0.0.1:8545"), // Local Hardhat
    [mainnet.id]: http(), // Default public mainnet RPC
  },
});

// 4️⃣ Create QueryClient for wagmi
const queryClient = new QueryClient();

// 5️⃣ Export provider wrapper
export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
