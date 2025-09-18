import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  depositUSDC,
  withdrawUSDC,
  borrowNFT,
  loadLendingData,
  repayLoan,
} from "../lib/interactions";
import {
  selectLendingReady,
  setLoan,
  depositRequest,
  depositSuccess,
  depositFail,
  withdrawRequest,
  withdrawSuccess,
  withdrawFail,
  selectBorrowing,
  repayRequest,
  repaySuccess,
  repayFail,
} from "../redux/reducers/lendingSlice";
import { selectUSDCContract, selectUSDCReady } from "../redux/reducers/tokenSlice";
import { ethers } from "ethers";

export default function Lending() {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.provider.account);
  const lendingContract = useSelector((state) => state.lending.contract);
  const usdcContract = useSelector(selectUSDCContract);
  const usdcReady = useSelector(selectUSDCReady);
  const watchNFT = useSelector((state) => state.watchNft);
  const depositing = useSelector((state) => state.lending.depositing);
  const withdrawing = useSelector((state) => state.lending.withdrawing);
  const { totalPoolUSDC, totalShares, userShares } = useSelector(
    (state) => state.lending
  );
  const loans = useSelector((state) => state.lending.loans);
  const ready = useSelector(selectLendingReady);
  const borrowing = useSelector(selectBorrowing);

  const ownedTokens = watchNFT.ownedTokens || [];
  const nftMetadataMap = watchNFT.metadata || {};

  const userNFTs = ownedTokens.map((tokenId) => ({
    tokenId,
    metadata: nftMetadataMap[tokenId] || {},
  }));

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedNFT, setSelectedNFT] = useState("");

  const formatDisplay = (value, precision = 2) => {
    if (!value) return "0.00";
    try {
      return Number(value).toFixed(precision);
    } catch {
      return "0.00";
    }
  };

  // Load lending data once ready
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
      const tx = await depositUSDC(lendingContract, usdcContract, account, depositAmount, dispatch);
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
      const tx = await withdrawUSDC(lendingContract, account, withdrawAmount, dispatch);
      dispatch(withdrawSuccess(tx.hash));
      await loadLendingData(lendingContract, account, dispatch);
      setWithdrawAmount("");
    } catch (err) {
      console.error("Withdrawal failed:", err);
      dispatch(withdrawFail(err.message));
    }
  };

  const handleBorrow = async () => {
    if (!selectedNFT) return;
    if (!lendingContract || !watchNFT.contract) return;

    try {
      const signer = window.ethereum
        ? new ethers.providers.Web3Provider(window.ethereum).getSigner(account)
        : null;

      const borrowedAmount = await borrowNFT(
        lendingContract,
        watchNFT.contract,
        selectedNFT,
        signer,
        dispatch
      );

      console.log(
        `✅ Borrowed ${ethers.utils.formatUnits(borrowedAmount, 18)} USDC against NFT ${selectedNFT}`
      );
    } catch (err) {
      console.error("❌ Borrow failed:", err);
    }
  };

  const handleRepay = async (loan) => {
    if (!loan.nftId || !lendingContract || !usdcContract) return;

    console.log("🔹 Repay button clicked for loan:", loan);

    try {
      dispatch(repayRequest());
      const tx = await repayLoan(
        lendingContract,
        usdcContract,
        loan.nftId,
        account,
        dispatch
      );
      dispatch(
        repaySuccess({
          nftId: loan.nftId,
          repaymentAmount: loan.repayment,
          transactionHash: tx.hash,
        })
      );
      await loadLendingData(lendingContract, account, dispatch);
    } catch (err) {
      console.error("Repay failed:", err);
      dispatch(repayFail(err.message));
    }
  };

  return (
    <div className="lending-pool-info">
      <h2>Lending Pool Info</h2>
      <p>Total Pool USDC: {formatDisplay(totalPoolUSDC)}</p>
      <p>Total Shares: {formatDisplay(totalShares)}</p>
      <p>Your Shares: {formatDisplay(userShares.shares)}</p>
      <p>Your USDC Value: {formatDisplay(userShares.usdcValue)}</p>

      {/* ---------------- USDC Deposit ---------------- */}
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
          disabled={!account || !ready || !usdcReady || depositing.isDepositing}
        >
          Deposit
        </button>
        {depositing.isDepositing && <p>Approving & depositing...</p>}
        {depositing.isSuccess && <p>✅ Deposit successful! Tx: {depositing.transactionHash}</p>}
        {depositing.error && <p>❌ Error: {depositing.error}</p>}
      </div>

      {/* ---------------- USDC Withdraw ---------------- */}
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
          disabled={!account || !ready || withdrawing.isWithdrawing}
        >
          Withdraw
        </button>
        {withdrawing.isWithdrawing && <p>Withdrawing...</p>}
        {withdrawing.isSuccess && <p>✅ Withdrawal successful! Tx: {withdrawing.transactionHash}</p>}
        {withdrawing.error && <p>❌ Error: {withdrawing.error}</p>}
      </div>

      {/* ---------------- Borrow Using NFT ---------------- */}
      <div className="borrow-section">
        <h3>Borrow USDC using NFT</h3>
        <select value={selectedNFT} onChange={(e) => setSelectedNFT(e.target.value)}>
          <option value="">Select NFT</option>
          {userNFTs.map((nft) => (
            <option key={nft.tokenId} value={nft.tokenId}>
              {nft.metadata?.name || `NFT #${nft.tokenId}`}
            </option>
          ))}
        </select>
        <button onClick={handleBorrow} disabled={!selectedNFT || !account || !lendingContract}>
          Borrow USDC
        </button>
        {borrowing?.isBorrowing && <p>Processing borrow...</p>}
        {borrowing?.isSuccess && (
          <p>✅ Borrowed {ethers.utils.formatUnits(borrowing.borrowedAmount, 18)} USDC!</p>
        )}
        {borrowing?.error && <p>❌ Error: {borrowing.error}</p>}
      </div>

      {/* ---------------- Active Loans + Repayment ---------------- */}
      <div className="loans-section">
        <h3>Your Active Loans</h3>
        {loans && Object.keys(loans).length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>NFT</th>
                <th>Borrowed</th>
                <th>Repayment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(loans).map(([nftId, loan]) => (
                <tr key={nftId}>
                  <td>#{nftId}</td>
                  <td>{ethers.utils.formatUnits(loan.borrowedAmount, 18)} USDC</td>
                  <td>{ethers.utils.formatUnits(loan.repayment, 18)} USDC</td>
                  <td>{loan.repaid ? "✅ Repaid" : "⏳ Active"}</td>
                  <td>
                    {!loan.repaid && (
                      <button onClick={() => handleRepay({ ...loan, nftId })}>
                        Repay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No active loans</p>
        )}
      </div>
    </div>
  );
}