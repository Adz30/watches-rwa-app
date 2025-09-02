import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [darkMode, setDarkMode] = useState(false)

  // Blockchain state
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [chainName, setChainName] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  // Initialize provider & listen to events
  useEffect(() => {
    if (window.ethereum) {
      const ethProvider = new ethers.BrowserProvider(window.ethereum)
      setProvider(ethProvider)

      // Handle account and network changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(ethers.getAddress(accounts[0]))
          fetchBalance(ethProvider, accounts[0])
        } else {
          setAccount(null)
          setBalance(null)
        }
      })

      window.ethereum.on('chainChanged', async (chainIdHex) => {
        const chainId = parseInt(chainIdHex, 16)
        const network = await ethProvider.getNetwork()
        setChainName(network.name)
        // Refresh balance on chain change
        if (account) fetchBalance(ethProvider, account)
      })
    } else {
      setError('No Ethereum wallet detected. Please install MetaMask or similar.')
    }
  }, [account, darkMode])

  // Connect wallet handler
  async function connectWallet() {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(ethers.getAddress(accounts[0]))

      const ethProvider = new ethers.BrowserProvider(window.ethereum)
      setProvider(ethProvider)

      const network = await ethProvider.getNetwork()
      setChainName(network.name)

      fetchBalance(ethProvider, accounts[0])
      setError(null)
    } catch (err) {
      setError('Failed to connect wallet.')
    }
  }

  async function fetchBalance(provider, userAddress) {
    const bal = await provider.getBalance(userAddress)
    setBalance(ethers.formatEther(bal))
  }

  return (
    <main className="app-container">
      <header className="header">
        <div className="logos">
          <a href="https://vitejs.dev" target="_blank" rel="noreferrer" title="Vite">
            <img src={viteLogo} alt="Vite Logo" className="logo vite" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer" title="React">
            <img src={reactLogo} alt="React Logo" className="logo react" />
          </a>
        </div>

        <button
          aria-label="Toggle dark mode"
          className="btn-theme-toggle"
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>
      </header>

      <section className="welcome-section">
        <h1>🚀 Kickstart Your  React + Vite + Web3 Project</h1>
        <p className="subtitle">
          A sleek starter kit — tailored for rapid dev, creative projects, and blockchain exploration.
        </p>

        <button
          className={`btn-count ${count > 10 ? 'btn-celebrate' : ''}`}
          onClick={() => setCount((c) => c + 1)}
        >
          You clicked me {count} {count === 1 ? 'time' : 'times'}!
        </button>

        {count > 10 && <p className="celebration-text">🎉 Wow, you really like clicking!</p>}

        <div className="blockchain-info">
          <h2>🔗 Blockchain Info</h2>
          {!account ? (
            <>
              <p>No wallet connected</p>
              <button className="btn-connect" onClick={connectWallet}>
                Connect Wallet
              </button>
            </>
          ) : (
            <>
              <p><strong>Account:</strong> {account}</p>
              <p><strong>Balance:</strong> {balance ? `${balance} ETH` : 'Loading...'}</p>
              <p><strong>Network:</strong> {chainName || 'Loading...'}</p>
            </>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      </section>

      <footer className="footer">
        <p>
          Explore the docs and customize your journey — all powered by{' '}
          <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
            Vite
          </a>{' '}
          +{' '}
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            React
          </a>{' '}
          +{' '}
          <a href="https://ethers.org" target="_blank" rel="noreferrer">
            ethers.js
          </a>
          .
        </p>
      </footer>
    </main>
  )
}

export default App
