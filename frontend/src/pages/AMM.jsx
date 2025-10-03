import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ethers } from "ethers";
import Swap from "../components/Swap";
import { getPoolByFraction, loadPoolInfo } from "../lib/interactions";

const AMM = () => {
  const dispatch = useDispatch();

  // Redux state
  const ammFactoryContract = useSelector((state) => state.amm.ammFactoryContract);
  const pools = useSelector((state) => state.amm.pools);
  const poolContracts = useSelector((state) => state.amm.poolContracts);
  const watchFractionData = useSelector((state) => state.watchFraction.tokens);
  const account = useSelector((state) => state.provider.account);
  const provider = useSelector((state) => state.provider.connection);
  const usdcContract = useSelector((state) => state.tokens.usdcContract);
  const usdcDecimals = useSelector((state) => state.tokens.decimals.usdc);
  const oraclePrices = useSelector((state) => state.oracle.prices);

  // Local state for selected watch
  const [selectedWatchId, setSelectedWatchId] = useState(null);

  // Pick first fraction on load
  useEffect(() => {
    const tokenIds = Object.keys(watchFractionData || {});
    if (tokenIds.length > 0) setSelectedWatchId(tokenIds[0]);
  }, [watchFractionData]);

  // Load pool info for all fractions
  useEffect(() => {
    if (!ammFactoryContract || !provider || !account) return;

    Object.entries(watchFractionData || {}).forEach(([watchId, data]) => {
      if (!data.fractionAddress) return;

      getPoolByFraction({
        ammFactoryContract,
        fractionAddress: data.fractionAddress,
        watchId,
        provider,
        account,
        dispatch,
        loadBalances: true,
      }).catch(console.error);
    });
  }, [ammFactoryContract, watchFractionData, provider, account, dispatch]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">AMM Swap Dashboard</h2>

      <div className="space-y-6">
        {Object.values(pools)
          .filter((p) => p.poolAddress)
          .map((pool) => {
            // Get fraction data for this pool
            const fractionData = Object.values(watchFractionData).find(
              (f) => f.fractionAddress === pool.fractionAddress
            );

            if (!fractionData) return null;

            const poolContract = poolContracts[fractionData.fractionAddress];

            return (
              <div
                key={pool.poolAddress}
                className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
              >
                <p>
                  <span className="font-medium">Pool:</span> {pool.poolAddress}
                </p>
                <p>
                  <span className="font-medium">Fraction:</span> {fractionData.fractionAddress}
                </p>
                <p>
                  <span className="font-medium">Fraction Balance:</span>{" "}
                  {pool.fractionBalance
                    ? ethers.utils.formatUnits(pool.fractionBalance, fractionData.contractDecimals)
                    : "0"}
                </p>
                <p>
                  <span className="font-medium">USDC Balance:</span>{" "}
                  {pool.usdcBalance ? ethers.utils.formatUnits(pool.usdcBalance, usdcDecimals) : "0"}
                </p>
                <p>
                  <span className="font-medium">Total Shares:</span>{" "}
                  {pool.totalShares
                    ? ethers.utils.formatUnits(pool.totalShares, fractionData.contractDecimals)
                    : "0"}
                </p>
                <p>
                  <span className="font-medium">Fee:</span> {pool.feeBps || 0}
                </p>

                {/* Swap box */}
                <div className="mt-4">
                  <Swap
                    poolContract={poolContract}
                    fractionData={fractionData}
                    usdcDecimals={usdcDecimals}
                    usdcTokenContract={usdcContract}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default AMM;
