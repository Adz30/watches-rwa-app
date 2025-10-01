import React, { useState } from "react";
import { ethers } from "ethers";
import { useSelector } from "react-redux";
import { swap } from "../lib/interactions";
import { selectUSDCContract } from "../redux/reducers/tokenSlice";

const Swap = ({ poolContract, fractionData, usdcDecimals }) => {
  const account = useSelector((state) => state.provider.account);
  const usdcContract = useSelector(selectUSDCContract);

  const [fromToken, setFromToken] = useState("USDC");
  const [amount, setAmount] = useState("");

  const handleSwap = async () => {
    if (!poolContract || !fractionData || !account || !amount) return;
    try {
      const tokenContract =
        fromToken === "USDC" ? usdcContract : fractionData.contract;
      const decimals = fromToken === "USDC" ? usdcDecimals : await fractionData.contract.decimals();
      const amountBN = ethers.utils.parseUnits(amount, decimals);

      const receipt = await swap({
        poolContract,
        fromToken,
        amount: amountBN,
        account,
        usdcTokenContract: usdcContract,
        fractionTokenContract: fractionData.contract,
        usdcDecimals
      });

      console.log("✅ Swap executed:", receipt.transactionHash);
      setAmount("");
    } catch (err) {
      console.error("❌ Swap failed:", err);
    }
  };

  return (
    <div style={{ marginTop: "10px", borderTop: "1px solid #ccc", paddingTop: "10px" }}>
      <h5>Swap</h5>
      <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
        <option value="USDC">USDC → Fraction</option>
        <option value="FRACTION">Fraction → USDC</option>
      </select>
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ marginLeft: "10px", width: "100px" }}
      />
      <button onClick={handleSwap} style={{ marginLeft: "10px" }}>
        Swap
      </button>
    </div>
  );
};

export default Swap;
