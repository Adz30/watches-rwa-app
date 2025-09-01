import { useState } from 'react';
import { CONTRACT_ADDRESSES } from '../../lib/contracts';
import { CogIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ContractSetup() {
  const [addresses, setAddresses] = useState(CONTRACT_ADDRESSES);
  const [saved, setSaved] = useState(false);

  const handleAddressChange = (contractName, address) => {
    setAddresses(prev => ({
      ...prev,
      [contractName]: address
    }));
  };

  const handleSave = () => {
    // In a real app, you'd save these to localStorage or environment
    localStorage.setItem('contractAddresses', JSON.stringify(addresses));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const contractFields = [
    { key: 'NFT_COLLATERAL_LENDING', label: 'NFT Collateral Lending' },
    { key: 'AMM_FACTORY', label: 'AMM Factory' },
    { key: 'WATCH_REGISTRY', label: 'Watch Registry' },
    { key: 'USDC', label: 'USDC Token' },
    { key: 'MOCK_ORACLE', label: 'Price Oracle' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-6">
        <CogIcon className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">Contract Setup</h2>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600 text-sm">
          Update the contract addresses below after deploying your contracts to the local network.
        </p>

        {contractFields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <input
              type="text"
              value={addresses[field.key]}
              onChange={(e) => handleAddressChange(field.key, e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? (
            <div className="flex items-center justify-center space-x-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Saved!</span>
            </div>
          ) : (
            'Save Addresses'
          )}
        </button>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">Deployment Instructions</h4>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Start Hardhat local node: <code className="bg-yellow-100 px-1 rounded">npx hardhat node</code></li>
          <li>Deploy contracts: <code className="bg-yellow-100 px-1 rounded">npx hardhat run scripts/Deploy.js --network localhost</code></li>
          <li>Copy the deployed addresses and paste them above</li>
          <li>Save the addresses and start using the dApp</li>
        </ol>
      </div>
    </div>
  );
}