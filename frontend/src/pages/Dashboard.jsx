import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getUserNFTsWithMetadata, loadOraclePrice } from "../lib/interactions";

import {
  setLoading,
  setError,
  selectWatchNftContractReady,
} from "../redux/reducers/watchNftSlice";

export default function Dashboard() {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.provider.connection);
  const account = useSelector((state) => state.provider.account);
  const ready = useSelector(selectWatchNftContractReady);
  const oracle = useSelector((state) => state.oracle.contract);
  const ownedTokens = useSelector((state) => state.watchNft.ownedTokens) || [];
  const tokenMetadata = useSelector((state) => state.watchNft.tokenMetadata) || {};
  const loadingNFTs = useSelector((state) => state.watchNft.loading);
  const { prices } = useSelector((state) => state.oracle);
  const fetchedRef = useRef(false);

  // Fetch NFTs once when ready
  useEffect(() => {
    if (!account || !ready || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchNFTs = async () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        await dispatch(getUserNFTsWithMetadata());
      } catch (err) {
        console.error("❌ Error fetching NFTs with metadata:", err);
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchNFTs();
  }, [account, ready, dispatch]);

  // Reset fetch flag if account changes
  useEffect(() => {
    fetchedRef.current = false;
  }, [account]);

  // Fetch Oracle prices
  useEffect(() => {
    if (!ownedTokens || ownedTokens.length === 0) {
      console.log("⏭️ Skipping oracle price load, no ownedTokens.");
      return;
    }

    if (!oracle || typeof oracle.getPrice !== "function") {
      console.warn("⏭️ Oracle not ready, skipping price fetch.");
      return;
    }

    if (!provider) {
      console.warn("⏭️ Provider not ready, skipping price fetch.");
      return;
    }

    const fetchPrices = async () => {
      try {
        const network = await provider.getNetwork();
        console.log("🌐 Current network:", network.chainId, network.name);

        console.log("🔄 Fetching prices for ownedTokens:", ownedTokens);
        for (const tokenId of ownedTokens) {
          try {
            const numericId = Number(tokenId); // ensure tokenId is a number
            const price = await oracle.getPrice(numericId);
            console.log(`✅ Token ${tokenId} price:`, price.toString());

            // Dispatch price to Redux
            dispatch(loadOraclePrice(tokenId, price.toString()));
          } catch (err) {
            console.error(`❌ Error fetching price for token ${tokenId}:`, err);
          }
        }
      } catch (err) {
        console.error("❌ Error checking network or fetching prices:", err);
      }
    };

    fetchPrices();
  }, [dispatch, ownedTokens, oracle, provider]);

  if (!ready) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
        Loading blockchain data...
      </p>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Your NFT Collection
      </h2>

      {loadingNFTs ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Loading NFTs...</p>
      ) : ownedTokens.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No NFTs found</p>
      ) : (
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
            const price = prices[tokenId];

            return (
              <div
                key={tokenId}
                style={{
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
                  Price: {price ? `${price} wei` : "Loading..."}
                </p>

                {metadata?.attributes && (
                  <div
                    style={{ fontSize: "10px", color: "#6b7280" }}
                    className="dark:text-gray-300"
                  >
                    {metadata.attributes.map((attr, i) => (
                      <p key={i} style={{ margin: "2px 0" }}>
                        <span style={{ fontWeight: "600" }}>{attr.trait_type}:</span> {attr.value}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
