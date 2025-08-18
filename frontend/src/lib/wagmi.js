import { createClient, configureChains } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";

// Define a local Hardhat chain
const localhostChain = {
  id: 31337,
  name: "localhost",
  network: "localhost",
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
};

const { chains, provider } = configureChains(
  [localhostChain],
  [
    jsonRpcProvider({
      rpc: (chain) => ({ http: chain.rpcUrls.default.http[0] }),
    }),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "Hardhat Token DApp",
  chains,
});

export const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export { chains, provider, RainbowKitProvider };
