import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useSelector, useDispatch } from "react-redux";
import {
  fractionalizeNFT,
  redeemNFT,
  loadFractionsForOwner,
  getPoolByFraction,
  loadPoolInfo,
  deployPool,
  addLiquidity,
  calculateUSDC,
} from "../lib/interactions";
import { setPoolError } from "../redux/reducers/ammSlice";
import { selectFractionalizerByToken, selectRedeemByToken } from "../redux/reducers/fractionalizerFactorySlice";
import { selectUSDCContract, selectUSDCReady } from "../redux/reducers/tokenSlice";

const Fractionalizer = () => {
  const dispatch = useDispatch();

  // Fractionalizer state
  const factoryContract = useSelector((state) => state.fractionalizerFactory.contract);
  const fractionalizerContract = useSelector((state) => state.fractionalizer.contract);
  const account = useSelector((state) => state.provider.account);
  const provider = useSelector((state) => state.provider.connection);
  const watchNFTContract = useSelector((state) => state.watchNft.contract);
  const ownedNFTs = useSelector((state) => state.watchNft.ownedTokens) || [];
  const watchFractionData = useSelector((state) => state.watchFraction.tokens);

  // AMM state
  const ammFactoryContract = useSelector((state) => state.amm.ammFactoryContract);
  const pools = useSelector((state) => state.amm.pools);
  const poolContracts = useSelector((state) => state.amm.poolContracts);
  const usdcContract = useSelector(selectUSDCContract);
  const usdcReady = useSelector(selectUSDCReady);
  const usdcDecimals = useSelector((state) => state.tokens.decimals.usdc);
  const oraclePrices = useSelector((state) => state.oracle.prices);

  // Local state
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [totalShares, setTotalShares] = useState(1000);
  const [selectedWatchId, setSelectedWatchId] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployErrorLocal, setDeployErrorLocal] = useState(null);
  const [fractionInput, setFractionInput] = useState("0");
  const [calculatedUSDC, setCalculatedUSDC] = useState(ethers.BigNumber.from(0));

  // Per-token states
  const selectedTokenState = useSelector((state) =>
    selectedNFT !== null ? selectFractionalizerByToken(state, selectedNFT) : {}
  );
  const redeemState = useSelector((state) =>
    selectedNFT !== null ? selectRedeemByToken(state, selectedNFT) : {}
  );

  // Load owned NFTs & fractions
  useEffect(() => {
    if (!ownedNFTs?.length || !factoryContract || !account) return;
    const firstTokenId = ownedNFTs[0];
    setSelectedNFT(firstTokenId);
    loadFractionsForOwner(factoryContract, ownedNFTs, provider, account, dispatch);
  }, [ownedNFTs, factoryContract, account, dispatch]);

  // Pick first fraction on load (AMM)
  useEffect(() => {
    if (watchFractionData[selectedNFT]?.fractionAddress) {
      setSelectedWatchId(selectedNFT);
    }
  }, [selectedNFT, watchFractionData]);

  // Load pool info if it exists
  useEffect(() => {
    if (!ammFactoryContract || !selectedWatchId || !provider || !account) return;
    const fractionAddress = watchFractionData[selectedWatchId]?.fractionAddress;
    if (!fractionAddress) return;

    getPoolByFraction({
      ammFactoryContract,
      fractionAddress,
      watchId: selectedWatchId,
      provider,
      account,
      dispatch,
      loadBalances: true,
    }).catch(console.error);
  }, [ammFactoryContract, selectedWatchId, provider, account, dispatch, watchFractionData]);

  // Compute USDC for liquidity
  useEffect(() => {
    if (!ammFactoryContract || !selectedWatchId || !fractionInput || !watchFractionData[selectedWatchId] || !oraclePrices) {
      setCalculatedUSDC(ethers.BigNumber.from(0));
      return;
    }

    const fetchUSDC = async () => {
      try {
        const fractionAmount = parseFloat(fractionInput);
        if (isNaN(fractionAmount) || fractionAmount <= 0) {
          setCalculatedUSDC(ethers.BigNumber.from(0));
          return;
        }
        const usdcBN = await calculateUSDC(selectedWatchId, fractionAmount, watchFractionData, oraclePrices, usdcDecimals);
        setCalculatedUSDC(usdcBN);
      } catch (err) {
        console.error("Failed to calculate USDC:", err);
        setCalculatedUSDC(ethers.BigNumber.from(0));
      }
    };
    fetchUSDC();
  }, [fractionInput, selectedWatchId, ammFactoryContract, watchFractionData, oraclePrices, usdcDecimals]);

  // Fractionalize NFT
  const handleFractionalize = async () => {
    if (!factoryContract || selectedNFT === null || totalShares <= 0) return;
    try {
      const totalSharesBN = ethers.utils.parseUnits(totalShares.toString(), 18);
      await fractionalizeNFT(factoryContract, watchNFTContract, dispatch, selectedNFT, totalSharesBN, account, provider);
    } catch (err) {
      console.error(err);
    }
  };

  // Redeem NFT
  const handleRedeem = async () => {
    if (!factoryContract || fractionalizerContract || selectedNFT === null) return;
    try {
      await redeemNFT(factoryContract, selectedNFT, account, provider, dispatch);
    } catch (err) {
      console.error(err);
    }
  };

  // Deploy pool
  const handleDeploy = async () => {
    if (!ammFactoryContract || !selectedWatchId || !account || !provider) return;
    const fractionAddress = watchFractionData[selectedWatchId]?.fractionAddress;
    if (!fractionAddress) return;

    setDeploying(true);
    setDeployErrorLocal(null);
    try {
      await deployPool(ammFactoryContract, fractionAddress, account, provider, dispatch, selectedWatchId);
    } catch (err) {
      console.error("Deploy failed:", err);
      setDeployErrorLocal(err.message || "Deploy failed");
    } finally {
      setDeploying(false);
    }
  };

  // Add liquidity
  const handleAddLiquidity = async () => {
    const fractionData = watchFractionData[selectedWatchId];
    const poolContract = poolContracts[fractionData?.fractionAddress];
    if (!poolContract || !fractionData?.contract || !usdcReady || !account || !usdcContract) return;

    try {
      const fractionDecimals = await fractionData.contract.decimals();
      const fractionAmountBN = ethers.utils.parseUnits(fractionInput || "0", fractionDecimals);
      if (fractionAmountBN.isZero()) return;
      const usdcAmountBN = calculatedUSDC;

      await addLiquidity(poolContract, usdcContract, fractionData.contract, fractionAmountBN, account, usdcAmountBN);
      await loadPoolInfo(poolContract.address, account, provider, dispatch);
      setFractionInput("0");
    } catch (err) {
      console.error("❌ Failed to add liquidity:", err);
      dispatch(setPoolError({ poolAddress: poolContract.address, error: err.message }));
    }
  };

  const fractionData = watchFractionData[selectedWatchId];
  const poolContract = fractionData ? poolContracts[fractionData.fractionAddress] : null;
  const poolData = poolContract ? pools[poolContract.address] : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Fractionalizer</h2>

      {/* NFT selector + shares */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select NFT</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100"
            value={selectedNFT || ""}
            onChange={(e) => setSelectedNFT(Number(e.target.value))}
          >
            {ownedNFTs.map((tokenId) => (
              <option key={tokenId} value={tokenId}>{`NFT #${tokenId}`}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Shares</label>
          <input
            type="number"
            min="1"
            step="1"
            value={totalShares}
            onChange={(e) => setTotalShares(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Fraction info */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-sm space-y-2 border border-gray-200 dark:border-gray-700">
        <p><span className="font-medium">Fraction Token Address:</span> {fractionData?.fractionAddress || "NFT not fractionalized yet"}</p>
        <p><span className="font-medium">Your Fraction Balance:</span> {fractionData?.balance ? fractionData.balance.toString() : "0"}</p>
        <p><span className="font-medium">Fraction Total Supply:</span> {fractionData?.totalSupply || "N/A"}</p>
      </div>

      {/* Fractionalize / Redeem buttons */}
      {selectedTokenState.error && <div className="text-red-500">{selectedTokenState.error}</div>}
      <button
        onClick={handleFractionalize}
        disabled={selectedTokenState.status === "loading"}
        className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedTokenState.status === "loading" ? "Fractionalizing..." : "Fractionalize NFT"}
      </button>

      {redeemState.error && <div className="text-red-500">{redeemState.error}</div>}
      <button
        onClick={handleRedeem}
        disabled={redeemState.status === "loading" || !fractionData?.fractionAddress}
        className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {redeemState.status === "loading" ? "Redeeming..." : "Redeem NFT"}
      </button>

      {/* Pool deployment / liquidity */}
      {fractionData?.fractionAddress && !poolData?.poolAddress && (
        <div className="space-y-2">
          {!deploying && !deployErrorLocal && (
            <button
              onClick={handleDeploy}
              className="w-full md:w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deploy Pool
            </button>
          )}
          {deploying && <p>⏳ Deploying pool...</p>}
          {deployErrorLocal && <p className="text-red-500">⚠️ {deployErrorLocal}</p>}
        </div>
      )}

      {poolData?.poolAddress && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-sm space-y-2 border border-gray-200 dark:border-gray-700">
          <p><span className="font-medium">Pool Address:</span> {poolData.poolAddress}</p>
          <p><span className="font-medium">Fraction Balance:</span> {fractionData && poolData.fractionBalance ? ethers.utils.formatUnits(poolData.fractionBalance, fractionData.contractDecimals) : "0"}</p>
          <p><span className="font-medium">USDC Balance:</span> {poolData.usdcBalance ? ethers.utils.formatUnits(poolData.usdcBalance, usdcDecimals) : "0"}</p>
          <p><span className="font-medium">Total Shares:</span> {fractionData && poolData.totalShares ? ethers.utils.formatUnits(poolData.totalShares, fractionData.contractDecimals) : "0"}</p>
          <p><span className="font-medium">Fee:</span> {poolData.feeBps || 0}</p>

          {/* Add liquidity */}
          <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2">
            <input
              type="number"
              placeholder="Fractions to deposit"
              value={fractionInput}
              onChange={(e) => setFractionInput(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-700 p-2 w-full md:w-40 dark:bg-gray-800 dark:text-gray-100"
            />
            <span>
              ≈ USDC: {calculatedUSDC ? ethers.utils.formatUnits(calculatedUSDC, usdcDecimals) : "0"}
            </span>
            <button
              onClick={handleAddLiquidity}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Liquidity
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fractionalizer;
