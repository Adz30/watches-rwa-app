import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ethers } from "ethers";

export default function Dashboard() {
  // ✅ Get Redux state once
  const ready = useSelector((state) => state.watchNft.contractReady);
  const ownedTokens = useSelector((state) => state.watchNft.ownedTokens) || [];
  const tokenMetadata = useSelector((state) => state.watchNft.tokenMetadata) || {};
  const prices = useSelector((state) => state.oracle.prices) || {};
  const loansObj = useSelector((state) => state.lending.loans) || {};

  // ✅ Memoize derived maps
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
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Your NFT Collection
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          justifyContent: "center",
        }}
      >
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
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "160px",
                backgroundColor: "white",
                color: "black",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                borderRadius: "12px",
                padding: "12px",
                transition: "transform 0.2s ease-in-out",
                border: "1px solid #e5e7eb",
              }}
              className="dark:bg-gray-900 dark:text-gray-100 hover:scale-105"
            >
              {isActiveLoan && (
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    backgroundColor: "red",
                    color: "white",
                    borderRadius: "8px",
                    padding: "2px 6px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    zIndex: 10,
                  }}
                >
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
                  style={{
                    width: "100%",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              )}

              <p
                style={{
                  fontWeight: "600",
                  fontSize: "12px",
                  marginTop: "8px",
                  marginBottom: "4px",
                }}
              >
                Token ID: {tokenId}
              </p>

              <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                Price: {displayPrice} USDC
              </p>

              {metadata?.attributes && (
                <div
                  style={{ fontSize: "10px", color: "#6b7280" }}
                  className="dark:text-gray-300"
                >
                  {metadata.attributes.map((attr, i) => (
                    <p key={i} style={{ margin: "2px 0" }}>
                      <span style={{ fontWeight: "600" }}>{attr.trait_type}:</span>{" "}
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
