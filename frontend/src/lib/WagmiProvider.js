"use client";

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, localhost } from 'wagmi/chains';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "@rainbow-me/rainbowkit/styles.css";

// 1️⃣ Define chains
const chains = [localhost, mainnet];

// 2️⃣ Get wallet connectors from RainbowKit
const { connectors } = getDefaultWallets({
  appName: "WatchDeFi",
  projectId: "watchdefi-project-id",
  chains,
});

// 3️⃣ Create Wagmi config
const config = createConfig({
  chains,
  connectors,
  transports: {
    [localhost.id]: http("http://127.0.0.1:8545"),
    [mainnet.id]: http(),
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
