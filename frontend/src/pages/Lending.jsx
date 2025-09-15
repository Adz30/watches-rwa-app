import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadLendingData, depositUSDC, withdrawUSDC } from "../lib/interactions";
import {
  selectLendingReady,
  depositRequest,
  depositSuccess,
  depositFail,
  withdrawRequest,
  withdrawSuccess,
  withdrawFail,
} from "../redux/reducers/lendingSlice";
import { selectUSDCContract, selectUSDCReady } from "../redux/reducers/tokenSlice";

export default function Lending() {
  const account = useSelector((state) => state.provider.account);
  const lendingContract = useSelector((state) => state.lending.contract);
  const usdcContract = useSelector(selectUSDCContract);
  const usdcReady = useSelector(selectUSDCReady);
  const depositing = useSelector((state) => state.lending.depositing);
  const withdrawing = useSelector((state) => state.lending.withdrawing);

  const { totalPoolUSDC, totalShares, userShares } = useSelector((state) => state.lending);
  const loading = useSelector((state) => state.lending.loading);
  const ready = useSelector(selectLendingReady);

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const dispatch = useDispatch();

  const formatDisplay = (value, precision = 2) => {
    if (!value) return "0.00";
    try {
      return Number(value).toFixed(precision);
    } catch {
      return "0.00";
    }
  };

  useEffect(() => {
    if (!ready || !usdcReady) return;
    loadLendingData(lendingContract, account, dispatch).catch((err) =>
      console.error("❌ Error loading lending data:", err)
    );
  }, [ready, usdcReady, lendingContract, account, dispatch]);

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount) || Number(depositAmount) <= 0) return;
    if (!lendingContract || !usdcContract) return;

    try {
      dispatch(depositRequest());
      const tx = await depositUSDC(lendingContract, usdcContract, account, depositAmount);
      dispatch(depositSuccess(tx.hash));
      await loadLendingData(lendingContract, account, dispatch);
      setDepositAmount("");
    } catch (err) {
      console.error("Deposit failed:", err);
      dispatch(depositFail(err.message));
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) return;
    if (!lendingContract) return;

    try {
      dispatch(withdrawRequest());
      const tx = await withdrawUSDC(lendingContract, account, withdrawAmount);
      dispatch(withdrawSuccess(tx.hash));
      await loadLendingData(lendingContract, account, dispatch);
      setWithdrawAmount("");
    } catch (err) {
      console.error("Withdrawal failed:", err);
      dispatch(withdrawFail(err.message));
    }
  };

  return (
    <div className="lending-pool-info">
      <h2>Lending Pool Info</h2>
      <p>Total Pool USDC: {formatDisplay(totalPoolUSDC)}</p>
      <p>Total Shares: {formatDisplay(totalShares)}</p>
      <p>Your Shares: {formatDisplay(userShares.shares)}</p>
      <p>Your USDC Value: {formatDisplay(userShares.usdcValue)}</p>

      <div className="deposit-section">
        <h3>Deposit USDC</h3>
        <input
          type="number"
          step="0.000000000000000001"
          min="0"
          placeholder="Amount to deposit"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
        />
        <button
          onClick={handleDeposit}
          disabled={!account || !ready || !usdcReady || loading || depositing.isDepositing}
        >
          Deposit
        </button>

        {depositing.isDepositing && <p>Approving & depositing...</p>}
        {depositing.isSuccess && <p>✅ Deposit successful! Tx: {depositing.transactionHash}</p>}
        {depositing.error && <p>❌ Error: {depositing.error}</p>}
      </div>

      <div className="withdraw-section">
        <h3>Withdraw USDC</h3>
        <input
          type="number"
          step="0.000000000000000001"
          min="0"
          placeholder="Amount to withdraw"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
        />
        <button
          onClick={handleWithdraw}
          disabled={!account || !ready || !lendingContract || withdrawing.isWithdrawing}
        >
          Withdraw
        </button>

        {withdrawing.isWithdrawing && <p>Withdrawing...</p>}
        {withdrawing.isSuccess && <p>✅ Withdrawal successful! Tx: {withdrawing.transactionHash}</p>}
        {withdrawing.error && <p>❌ Error: {withdrawing.error}</p>}
      </div>
    </div>
  );
}
