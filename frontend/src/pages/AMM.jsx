import React, { use, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ethers } from "ethers";
import Swap from "../components/Swap";
import {
  getPoolByFraction,
  loadPoolInfo,
  deployPool,
  addLiquidity,
  calculateUSDC,
} from "../lib/interactions";
import { setPoolError } from "../redux/reducers/ammSlice";
import { selectUSDCContract, selectUSDCReady } from "../redux/reducers/tokenSlice";

const AMM = () => {
  const dispatch = useDispatch();

  // Redux state
  const ammFactoryContract = useSelector((state) => state.amm.ammFactoryContract);
  const pools = useSelector((state) => state.amm.pools);
  const poolContracts = useSelector((state) => state.amm.poolContracts);
  const watchFractionData = useSelector((state) => state.watchFraction.tokens);
  const account = useSelector((state) => state.provider.account);
  const provider = useSelector((state) => state.provider.connection);
  const usdcContract = useSelector(selectUSDCContract);
  const usdcReady = useSelector(selectUSDCReady);
  const usdcDecimals = useSelector((state) => state.tokens.decimals.usdc);
  const oraclePrices = useSelector((state) => state.oracle.prices);

  // Local state
  const [selectedWatchId, setSelectedWatchId] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployErrorLocal, setDeployErrorLocal] = useState(null);
  const [fractionInput, setFractionInput] = useState("0");
  const [calculatedUSDC, setCalculatedUSDC] = useState(ethers.BigNumber.from(0));

  // Pick first fraction on load
  useEffect(() => {
    const tokenIds = Object.keys(watchFractionData || {});
    if (tokenIds.length > 0) setSelectedWatchId(tokenIds[0]);
  }, [watchFractionData]);

  // Load pool info if pool exists
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

  console.log("Requested pool info for watchId:", selectedWatchId, "fraction:", fractionAddress);
}, [ammFactoryContract, selectedWatchId, provider, account, dispatch, watchFractionData]);

  // Compute USDC needed for input
  useEffect(() => {
    if (
      !ammFactoryContract ||
      !selectedWatchId ||
      !fractionInput ||
      !watchFractionData[selectedWatchId] ||
      !oraclePrices
    ) {
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

        const usdcBN = await calculateUSDC(
          selectedWatchId,
          fractionAmount,
          watchFractionData,
          oraclePrices,
          usdcDecimals
        );

        setCalculatedUSDC(usdcBN);
      } catch (err) {
        console.error("Failed to calculate USDC:", err);
        setCalculatedUSDC(ethers.BigNumber.from(0));
      }
    };

    fetchUSDC();
  }, [fractionInput, selectedWatchId, ammFactoryContract, watchFractionData, oraclePrices, usdcDecimals]);
  
 useEffect(() => {
  if (!selectedWatchId) return; // skip if no watch selected
  const price18 = oraclePrices[selectedWatchId];
  if (!price18) return; // skip if price not loaded

  console.log("Oracle price (18 decimals):", price18.toString());
  console.log("Oracle price (human-readable):", ethers.utils.formatUnits(price18, 18));
}, [oraclePrices, selectedWatchId]);
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

      console.log("Adding liquidity with:");
      console.log("Fraction (BN):", fractionAmountBN.toString(), "| Human:", ethers.utils.formatUnits(fractionAmountBN, fractionDecimals));
      console.log("USDC (BN):", usdcAmountBN.toString(), "| Human:", ethers.utils.formatUnits(usdcAmountBN, usdcDecimals));

      await addLiquidity(poolContract, usdcContract, fractionData.contract, fractionAmountBN, account, usdcAmountBN);
      await loadPoolInfo(poolContract.address, account, provider, dispatch )
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
    <div style={{ padding: "20px" }}>
      <h2>AMM Page</h2>
      <p>Selected NFT: {selectedWatchId || "None"}</p>
      <p>Fraction: {fractionData?.fractionAddress || "None"}</p>

      {poolData?.error && <p style={{ color: "red" }}>⚠️ {poolData.error}</p>}
      {poolData?.loading && <p>Loading pool info...</p>}

      {poolData?.poolAddress ? (
        <div style={{ marginTop: "20px" }}>
          <p>
            Fraction Balance:{" "}
            {fractionData && poolData.fractionBalance
              ? ethers.utils.formatUnits(poolData.fractionBalance, fractionData.contractDecimals)
              : "0"}
          </p>
          <p>
            USDC Balance:{" "}
            {poolData.usdcBalance
              ? ethers.utils.formatUnits(poolData.usdcBalance, usdcDecimals)
              : "0"}
          </p>
          <p>
            Total Shares:{" "}
            {fractionData && poolData.totalShares
              ? ethers.utils.formatUnits(poolData.totalShares, fractionData.contractDecimals)
              : "0"}
          </p>
          <p>Fee: {poolData.feeBps || 0}</p>

          <h4>Add Liquidity</h4>
          <input
            type="number"
            placeholder="Fractions to deposit"
            value={fractionInput}
            onChange={(e) => setFractionInput(e.target.value)}
            style={{ marginRight: "10px", width: "150px" }}
          />
          <span>
            ≈ USDC needed:{" "}
            {calculatedUSDC ? ethers.utils.formatUnits(calculatedUSDC, usdcDecimals) : "0"}
          </span>
          <br />
          <button onClick={handleAddLiquidity} style={{ marginTop: "10px" }}>
            Add Liquidity
          </button>
        </div>
      ) : (
        <>
          {!deploying && !deployErrorLocal && <button onClick={handleDeploy}>Deploy Pool</button>}
          {deploying && <p>⏳ Deploying pool...</p>}
          {deployErrorLocal && <p style={{ color: "red" }}>⚠️ {deployErrorLocal}</p>}
        </>
      )}

      <hr />
     <h3>Deployed Pools</h3>
{Object.values(pools)
  .filter((p) => p.poolAddress)
  .map((p) => {
    const poolContract = poolContracts[watchFractionData[selectedWatchId]?.fractionAddress];
    return (
      <div
        key={p.poolAddress}
        style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}
      >
        <p>Pool: {p.poolAddress}</p>
        <p>
          Fraction Balance:{" "}
          {fractionData && p.fractionBalance
            ? ethers.utils.formatUnits(p.fractionBalance, fractionData.contractDecimals)
            : "0"}
        </p>
        <p>
          USDC Balance:{" "}
          {p.usdcBalance ? ethers.utils.formatUnits(p.usdcBalance, usdcDecimals) : "0"}
        </p>
        <p>
          Total Shares:{" "}
          {fractionData && p.totalShares
            ? ethers.utils.formatUnits(p.totalShares, fractionData.contractDecimals)
            : "0"}
        </p>
        <p>Fee: {p.feeBps || 0}</p>

        {/* 🔄 Swap box */}
        <Swap
          poolContract={poolContract}
          fractionData={fractionData}
          usdcDecimals={usdcDecimals}
          usdcTokenContract={usdcContract}


        />
      </div>
    );
  })}
  </div>
  );
}


export default AMM;
