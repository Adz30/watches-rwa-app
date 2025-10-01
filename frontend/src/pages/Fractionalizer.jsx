import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useSelector, useDispatch } from "react-redux";
import {
  // getFractionalTokenInfo,
  fractionalizeNFT,
  redeemNFT,
  loadFractionsForOwner,
} from "../lib/interactions";
import {
  selectFractionalizerByToken,
  selectRedeemByToken,
} from "../redux/reducers/fractionalizerFactorySlice";

const Fractionalizer = () => {
  const factoryContract = useSelector(
    (state) => state.fractionalizerFactory.contract
  );
  const fractionalizerContract = useSelector(
    (state) => state.fractionalizer.contract
  );
  const account = useSelector((state) => state.provider.account);
  const provider = useSelector((state) => state.provider.connection);
  const watchNFTContract = useSelector((state) => state.watchNft.contract);
  const ownedNFTs = useSelector((state) => state.watchNft.ownedTokens) || []; // just IDs
  const watchFractionData = useSelector((state) => state.watchFraction.tokens);
  const dispatch = useDispatch();

  const [selectedNFT, setSelectedNFT] = useState(null);
  const [totalShares, setTotalShares] = useState(1000);

  // Per-token states
  const selectedTokenState = useSelector((state) =>
    selectedNFT !== null ? selectFractionalizerByToken(state, selectedNFT) : {}
  );
  const redeemState = useSelector((state) =>
    selectedNFT !== null ? selectRedeemByToken(state, selectedNFT) : {}
  );

  useEffect(() => {
    if (!ownedNFTs?.length || !factoryContract || !account) return;

    const firstTokenId = ownedNFTs[0];
    setSelectedNFT(firstTokenId);

    // Better: load fractions using factory + tokenIds
    loadFractionsForOwner(
      factoryContract, ownedNFTs, provider, account, dispatch
    );
  }, [ownedNFTs, factoryContract, account, dispatch]);

  const handleFractionalize = async () => {
    if (!factoryContract || selectedNFT === null || totalShares <= 0) return;

    try {
      const totalSharesBN = ethers.utils.parseUnits(totalShares.toString(), 18);
      await fractionalizeNFT(
        factoryContract,
        watchNFTContract,
        dispatch,
        selectedNFT,
        totalSharesBN,
        account,
        provider
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleRedeem = async () => {
    if (!factoryContract || fractionalizerContract || selectedNFT === null)
      return;

    try {
      await redeemNFT(
        factoryContract,
        selectedNFT,
        account,
        provider,
        dispatch
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Fractionalizer Page</h2>

      <label>
        Select NFT:
        <select
          value={selectedNFT || ""}
          onChange={(e) => setSelectedNFT(Number(e.target.value))}
        >
          {ownedNFTs.map((tokenId) => (
            <option key={tokenId} value={tokenId}>
              {`NFT #${tokenId}`}
            </option>
          ))}
        </select>
      </label>

      <label>
        Total Shares:
        <input
          type="number"
          min="1"
          step="1"
          value={totalShares}
          onChange={(e) => setTotalShares(Number(e.target.value))}
        />
      </label>

      <p></p>
      <p>
        Fraction Token Address:{" "}
        {watchFractionData[selectedNFT]?.fractionAddress ||
          "NFT not fractionalized yet"}
      </p>
      <p>
        Your Fraction Balance:{" "}
        {watchFractionData[selectedNFT]?.balance
          ? watchFractionData[selectedNFT].balance.toString()
          : "0"}
      </p>
      <p>Fraction Total Supply: {watchFractionData[selectedNFT]?.totalSupply || "N/A"}</p>

      {/* Fractionalize errors */}
      {selectedTokenState.error && (
        <div style={{ color: "red", margin: "10px 0" }}>
          ❌ {selectedTokenState.error}
        </div>
      )}

      <button
        onClick={handleFractionalize}
        disabled={selectedTokenState.status === "loading"}
      >
        {selectedTokenState.status === "loading"
          ? "Fractionalizing..."
          : "Fractionalize Selected NFT"}
      </button>

      {/* Redeem errors */}
      {redeemState.error && (
        <div style={{ color: "red", margin: "10px 0" }}>
          ❌ {redeemState.error}
        </div>
      )}

      <button
        onClick={handleRedeem}
        disabled={
          redeemState.status === "loading" ||
          !watchFractionData[selectedNFT]?.fractionAddress
        }
      >
        {redeemState.status === "loading" ? "Redeeming..." : "Redeem NFT"}
      </button>
    </div>
  );
};

export default Fractionalizer;
