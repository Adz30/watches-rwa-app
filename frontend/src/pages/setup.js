import ContractSetup from '../components/Setup/ContractSetup';
import { CogIcon } from '@heroicons/react/24/outline';

export default function SetupPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CogIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup WatchDeFi</h1>
        <p className="text-gray-600">
          Configure your contract addresses to connect the frontend with your deployed smart contracts
        </p>
      </div>

      {/* Contract Setup */}
      <ContractSetup />

      {/* Additional Setup Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Next Steps</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start space-x-2">
            <span className="font-bold">1.</span>
            <span>Make sure your Hardhat local network is running on port 8545</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">2.</span>
            <span>Deploy all contracts using the provided deployment scripts</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">3.</span>
            <span>Update the contract addresses in the form above</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">4.</span>
            <span>Connect your MetaMask wallet to the localhost network</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">5.</span>
            <span>Start using the lending and AMM features!</span>
          </li>
        </ul>
      </div>
    </div>
  );
}