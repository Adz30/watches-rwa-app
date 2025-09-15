import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Routes, Route } from 'react-router-dom'

import Navigation from './components/Navigation'

import Dashboard from './pages/Dashboard'
import Lending from './pages/Lending'
import AMM from './pages/AMM'
import Fractionalizer from './pages/Fractionalizer'
import MintNFT from "./pages/MintNFT";

import { selectWatchNftContractReady, setLoading } from './redux/reducers/watchNftSlice'

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadUSDC,
  loadOracle,
  loadLending,
  loadFractionalizerFactory,
  loadFractionalizer,
  loadAmmFactory,
  loadWatchNFT,
  
} from "./lib/interactions";

import CONFIG from "./config.json"; // import your chain config
export default function App() {
  const dispatch = useDispatch()
  const contractReady = useSelector(selectWatchNftContractReady) // ✅ useSelector here in render

  useEffect(() => {
    if (!window.ethereum) return
    const init = async () => {
      try {
        dispatch(setLoading(true))
        const provider = await loadProvider(dispatch)
        if (!provider) return

        const chainId = await loadNetwork(provider, dispatch)
        const account = await loadAccount(dispatch)

        const chainConfig = CONFIG[chainId]
        if (!chainConfig) {
          console.warn("⚠️ No config for chainId:", chainId)
          dispatch(setLoading(false))
          return
        }

        await loadUSDC(provider, chainId, account, dispatch)
        
        await loadOracle(provider, dispatch, chainConfig.oracle.address)
        await loadWatchNFT(provider, dispatch, chainConfig.watchNFT.address)
        const lendingContract = await loadLending(provider, dispatch, chainConfig.lending.address, account);

if (lendingContract) {
  console.log("Contract ABI functions:", Object.keys(lendingContract.interface.functions));
  console.log("Contract address:", lendingContract.address);
} else {
  console.warn("⚠️ Lending contract not loaded");
}
        
        await loadFractionalizerFactory(provider, dispatch, chainConfig.fractionalizerFactory.address)
        await loadFractionalizer(provider, dispatch, chainConfig.fractionalizerImpl.address)
       // await loadAmmFactory(provider, dispatch, chainConfig.factory.address)

        console.log("✅ All contracts loaded")
        dispatch(setLoading(false))
      } catch (err) {
        console.error("❌ Error initializing blockchain data:", err)
        dispatch(setLoading(false))
      }
    }

    init()
    const handleChainChanged = () => window.location.reload()
    window.ethereum.on('chainChanged', handleChainChanged)
    window.ethereum.on('accountsChanged', init)

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged)
      window.ethereum.removeListener('accountsChanged', init)
    }
  }, [dispatch])

  if (!contractReady) return <p>Loading blockchain data...</p>

  return (
    <div>
      <Navigation />
      <main className="p-4 max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mint" element={<MintNFT />} />
          <Route path="/lending" element={<Lending/>} />
          <Route path="/amm" element={<AMM />} />
          <Route path="/fractionalizer" element={<Fractionalizer />} />
        </Routes>
      </main>
    </div>
  )
}
