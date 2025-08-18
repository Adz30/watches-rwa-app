"use client";

import { useState, useEffect } from "react";
import { useAccount, useContractRead } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { contractConfig } from "@/lib/contract";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState("0");
  const [mounted, setMounted] = useState(false);

  // Ensure client-only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data } = useContractRead({
    ...contractConfig,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    watch: true,
  });

  useEffect(() => {
    if (data) setBalance(data.toString());
  }, [data]);

  if (!mounted) return null; // render nothing on server

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-md p-8 text-center min-w-[300px]">
        <ConnectButton className="mb-4" />
        <h1 className="mb-4 text-2xl font-bold">Hardhat Token DApp</h1>
        {isConnected ? (
          <>
            <p className="mb-2 break-all text-center text-gray-700">
              Wallet: {address}
            </p>
            <p className="font-semibold mb-4">Token Balance: {balance}</p>
          </>
        ) : (
          <p className="text-gray-600 text-center">Please connect your wallet</p>
        )}
      </div>
    </div>
  );
}
