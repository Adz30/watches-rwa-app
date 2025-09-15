import { useSelector, useDispatch } from 'react-redux';
import Blockies from 'react-blockies';
import { loadAccount, loadProvider, loadNetwork, loadUSDC } from '../lib/interactions';
import { useState } from 'react';

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
    <nav className="bg-gray-800 text-white px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between">
      {/* Brand + Hamburger */}
      <div className="flex justify-between items-center">
        <a href="/" className="text-xl font-bold">RWA Watch DApp</a>
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Menu Links + Network + Account */}
      <div className={`flex flex-col md:flex-row md:items-center gap-4 mt-3 md:mt-0 ${menuOpen ? 'flex' : 'hidden md:flex'}`}>
        {/* Links */}
        <div className="flex flex-col md:flex-row md:gap-4 gap-2 text-sm md:text-base">
          <a href="/" className="hover:text-blue-400">Dashboard</a>
          <a href="/mint" className="hover:text-blue-400">Mint NFT</a>
          <a href="/lending" className="hover:text-blue-400">Lending</a>
          <a href="/amm" className="hover:text-blue-400">AMM</a>
          <a href="/fractionalizer" className="hover:text-blue-400">Fractionalizer</a>
        </div>

        {/* Network Selector */}
        <select
          value={chainId ? `0x${chainId.toString(16)}` : '0'}
          onChange={networkHandler}
          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
        >
          <option value="0" disabled>Select Network</option>
          <option value="0x7A69">Localhost</option>
          <option value="0x5">Goerli</option>
        </select>

        {/* Account */}
        {account ? (
          <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded text-sm">
            <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
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
            className="bg-blue-600 hover:bg-blue-500 px-4 py-1 rounded text-sm font-semibold"
          >
            Connect
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
