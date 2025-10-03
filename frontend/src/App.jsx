import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";

import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Lending from "./pages/Lending";
import AMM from "./pages/AMM";
import Fractionalizer from "./pages/Fractionalizer";
import MintNFT from "./pages/MintNFT";
import TradingHub from "./pages/TradingHub";

import { setLoading } from "./redux/reducers/watchNftSlice";
import { setLoan } from "./redux/reducers/lendingSlice";
import { selectWatchNftContractReady } from "./redux/reducers/watchNftSlice";


import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadUSDC,
  loadOracle,
  loadLending,
  loadFractionalizerFactory,
  loadWatchNFT,
  getUserNFTsWithMetadata,
  fetchUserLoansWithRepayment,
  loadOraclePrice,
  loadAmmFactory,
  loadFractionsForOwner,
  
  
} from "./lib/interactions";

import CONFIG from "./config.json";

export default function App() {
  const dispatch = useDispatch();

  // Redux selectors
  const contractReady = useSelector(selectWatchNftContractReady);
  const provider = useSelector((state) => state.provider.connection);
  const oracle = useSelector((state) => state.oracle.contract);
  const lendingContract = useSelector((state) => state.lending.contract);
  const ownedTokens = useSelector((state) => state.watchNft.ownedTokens) || [];
  const oraclePrices = useSelector((state) => state.oracle.prices) || {};
  const loans = useSelector((state) => state.lending.loans) || {};
  const account = useSelector((state) => state.provider.account);
   const factoryContract = useSelector(
    (state) => state.fractionalizerFactory.contract
  );
  const ammFactoryContract = useSelector((state) => state.amm.ammFactoryContract);

  // Debugging logs
  useEffect(() => {
    console.log("🏦 AMM Factory Contract:", ammFactoryContract ? ammFactoryContract.address : "Not loaded");
  }, [ammFactoryContract]);

  // 1️⃣ Initialize provider, network, account, and load contracts
  useEffect(() => {
    if (!window.ethereum) return;

    const init = async () => {
      try {
        dispatch(setLoading(true));

        const provider = await loadProvider(dispatch);
        if (!provider) return;

        const chainId = await loadNetwork(provider, dispatch);
        const userAccount = await loadAccount(dispatch);

        const chainConfig = CONFIG[chainId];
        if (!chainConfig) {
          console.warn("⚠️ No config for chainId:", chainId);
          dispatch(setLoading(false));
          return;
        }

        await loadUSDC(provider, chainId, userAccount, dispatch);
        await loadOracle(provider, dispatch, chainConfig.oracle.address);
        await loadWatchNFT(provider, dispatch, chainConfig.watchNFT.address);
        await loadLending(provider, dispatch, chainConfig.lending.address, userAccount);
        await loadFractionalizerFactory(provider, dispatch, chainConfig.fractionalizerFactory.address);
        await loadAmmFactory(provider, userAccount, dispatch, chainConfig.factory.address);

        console.log("✅ All contracts loaded");
        dispatch(setLoading(false));
      } catch (err) {
        console.error("❌ Error initializing contracts:", err);
        dispatch(setLoading(false));
      }
    };

    init();

    const handleChainChanged = () => window.location.reload();
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("accountsChanged", init);

    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("accountsChanged", init);
    };
  }, [dispatch]);

  // 2️⃣ Fetch NFTs + metadata (only if not already loaded)
  useEffect(() => {
    if (!contractReady || !account) return;
    if (ownedTokens.length) return; // Already have NFTs

    dispatch(getUserNFTsWithMetadata());
  }, [contractReady, account, ownedTokens.length, dispatch]);

  // 3️⃣ Load Oracle prices for missing tokenIds
  useEffect(() => {
    if (!contractReady || !oracle || !ownedTokens.length) return;

    const missingPrices = ownedTokens.filter((tokenId) => !oraclePrices[tokenId]);
    if (!missingPrices.length) return;

    missingPrices.forEach((tokenId) => {
      dispatch(loadOraclePrice(tokenId, oracle));
    });
    console.log("✅ Oracle prices dispatched for missing tokens");
  }, [contractReady, oracle, ownedTokens, oraclePrices, dispatch]);

  // 4️⃣ Load loans for missing tokenIds
  useEffect(() => {
    if (!contractReady || !lendingContract || !ownedTokens.length || !account) return;

    const missingLoans = ownedTokens.filter((tokenId) => !loans[tokenId]);
    if (!missingLoans.length) return;

    const fetchLoans = async () => {
      const loansData = await fetchUserLoansWithRepayment(lendingContract, missingLoans, account, dispatch);
      loansData.forEach((loan) => dispatch(setLoan(loan)));
      console.log("✅ Loans loaded for missing tokens");
    };
    

    fetchLoans();
  }, [contractReady, lendingContract, ownedTokens, loans, account, dispatch]);



  useEffect(() => {
  console.log("📄 Current loans in Redux:", loans);
  console.table(
    Object.entries(loans).map(([nftId, loan]) => ({
      NFT: nftId,
      Borrower: loan.borrower,
      BorrowedAmount: loan.borrowedAmount,
      Repaid: loan.repaid,
      Repayment: loan.repayment
    }))
  );
}, [loans]);


  useEffect(() => {
    if (!account || !factoryContract || !ownedTokens.length) return;

    // Load fraction data for all owned NFTs
    loadFractionsForOwner(factoryContract, ownedTokens, provider, account, dispatch);
    console.log("✅ Loading fractions for owned NFTs from app page" );
  }, [account, factoryContract, ownedTokens, provider, dispatch]);





  if (!contractReady) {
    return <p className="text-center mt-6">Loading blockchain data...</p>;
  }

  return (
   
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="p-4 max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mint" element={<MintNFT />} />
          <Route path="/lending" element={<Lending />} />
          <Route path="/tradinghub" element={<TradingHub />} />
          <Route path="/amm" element={<AMM />} />
          <Route path="/fractionalizer" element={<Fractionalizer />} />
        </Routes>
      </main>
    </div>
  );
}
