import { useSelector, useDispatch } from 'react-redux';
import Blockies from 'react-blockies';
import { useState } from 'react';
import { loadAccount, loadProvider, loadNetwork, loadUSDC } from '../lib/interactions';

const Navigation = () => {
  const dispatch = useDispatch();
  const { account, chainId } = useSelector(state => state.provider);
  const [menuOpen, setMenuOpen] = useState(false);

  const connectHandler = async () => {
    try {
      const provider = await loadProvider(dispatch);
      const currentChainId = await loadNetwork(provider, dispatch);
      const currentAccount = await loadAccount(dispatch);
      await loadUSDC(provider, dispatch, currentAccount, currentChainId);
    } catch (err) {
      console.error("Error connecting wallet:", err);
    }
  };

  const networkHandler = async (e) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: e.target.value }],
      });
    } catch (err) {
      console.error("Error switching network:", err);
    }
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold hover:text-blue-400 transition-colors">
              RWA Watch DApp
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <a href="/" className="px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">Dashboard</a>
            <a href="/Mint" className="px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">Mint</a>
            <a href="/TradingHub" className="px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">Trading Hub</a>
            <a href="/Lending" className="px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">Lending & Borrowing</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <select
              value={chainId ? `0x${chainId.toString(16)}` : '0'}
              onChange={networkHandler}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0" disabled>Select Network</option>
              <option value="0x7A69">Localhost</option>
              <option value="0x5">Goerli</option>
            </select>

            {account ? (
              <div className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium">{account.slice(0, 6)}...{account.slice(-4)}</span>
                <Blockies
                  seed={account}
                  size={10}
                  scale={2}
                  color="#2187D0"
                  bgColor="#F1F2F9"
                  spotColor="#767F92"
                  className="rounded"
                />
              </div>
            ) : (
              <button
                onClick={connectHandler}
                className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-semibold transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-700">
          <div className="px-4 py-3 space-y-2">
            <a href="/" className="block px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">Dashboard</a>
            <a href="/mint" className="block px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">Mint NFT</a>
            <a href="/fractionalizer" className="block px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">Fractionalize</a>
            <a href="/amm" className="block px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">AMM</a>
            <a href="/lending" className="block px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">Lending</a>

            <div className="pt-3 border-t border-gray-700 space-y-3">
              <select
                value={chainId ? `0x${chainId.toString(16)}` : '0'}
                onChange={networkHandler}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-3 py-2 text-sm transition-colors"
              >
                <option value="0" disabled>Select Network</option>
                <option value="0x7A69">Localhost</option>
                <option value="0x5">Goerli</option>
              </select>

              {account ? (
                <div className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium">{account.slice(0, 6)}...{account.slice(-4)}</span>
                  <Blockies
                    seed={account}
                    size={10}
                    scale={2}
                    color="#2187D0"
                    bgColor="#F1F2F9"
                    spotColor="#767F92"
                    className="rounded"
                  />
                </div>
              ) : (
                <button
                  onClick={connectHandler}
                  className="w-full bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-semibold transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;