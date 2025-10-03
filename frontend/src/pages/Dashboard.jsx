import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ethers } from "ethers";

export default function Dashboard() {
  // ✅ Redux state
  const ready = useSelector((state) => state.watchNft.contractReady);
  const ownedTokens = useSelector((state) => state.watchNft.ownedTokens) || [];
  const tokenMetadata = useSelector((state) => state.watchNft.tokenMetadata) || {};
  const prices = useSelector((state) => state.oracle.prices) || {};
  const loansObj = useSelector((state) => state.lending.loans) || {};

  // ✅ Memoized derived maps
  const loansMap = useMemo(() => {
    const map = {};
    Object.values(loansObj).forEach((loan) => {
      if (loan?.nftId) map[loan.nftId.toString()] = loan;
    });
    return map;
  }, [loansObj]);

  const pricesMap = useMemo(() => {
    const map = {};
    ownedTokens.forEach((tokenId) => {
      const price = prices[tokenId.toString()];
      map[tokenId] =
        price !== undefined && price !== null
          ? `$${parseFloat(ethers.utils.formatUnits(price, 18)).toLocaleString()}`
          : "Loading...";
    });
    return map;
  }, [ownedTokens, prices]);

  if (!ready) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
        Loading blockchain data...
      </p>
    );
  }

  if (ownedTokens.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
        No NFTs found
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        Your NFT Collection
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {ownedTokens.map((tokenId) => {
          const metadata = tokenMetadata[tokenId];
          const displayPrice = pricesMap[tokenId];
          const loan = loansMap[tokenId];
          const isActiveLoan = loan && !loan.repaid;
          const borrowedAmount = isActiveLoan
            ? ethers.utils.formatUnits(loan.borrowedAmount, 18)
            : null;

          return (
            <div
              key={tokenId}
              className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-gray-700 shadow-md rounded-xl p-3 hover:scale-105 transition-transform"
            >
              {isActiveLoan && (
                <div className="absolute top-2 right-2 bg-red-600 text-white rounded-md px-2 py-1 text-xs font-bold z-10">
                  {`Active Loan${
                    borrowedAmount
                      ? `: ${parseFloat(borrowedAmount).toLocaleString()} USDC`
                      : ""
                  }`}
                </div>
              )}

              {metadata?.image && (
                <img
                  src={metadata.image.replace(
                    "ipfs://",
                    "https://gateway.pinata.cloud/ipfs/"
                  )}
                  alt={`NFT ${tokenId}`}
                  className="w-full h-28 object-cover rounded-md"
                />
              )}

              <p className="mt-2 mb-1 text-sm font-semibold">
                Token ID: {tokenId}
              </p>

              <p className="mb-1 text-sm font-semibold">
                Price: {displayPrice} USDC
              </p>

              {metadata?.attributes && (
                <div className="text-xs text-gray-500 dark:text-gray-300">
                  {metadata.attributes.map((attr, i) => (
                    <p key={i} className="my-[2px]">
                      <span className="font-semibold">{attr.trait_type}:</span>{" "}
                      {attr.value}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
