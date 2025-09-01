import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWalletClient } from 'wagmi';
import {
  CONTRACT_ADDRESSES,
  NFT_COLLATERAL_LENDING_ABI,
  AMM_ABI,
  AMM_FACTORY_ABI,
  WATCH_REGISTRY_ABI,
  ERC20_ABI,
  WATCH_FRACTION_ABI,
  FRACTIONALIZER_FACTORY_ABI,
} from '../lib/contracts';

export function useContracts() {
  const { data: walletClient } = useWalletClient();

  const contracts = useMemo(() => {
    if (!walletClient) return null;

    const provider = new ethers.BrowserProvider(walletClient.transport);
    const getSigner = async () => await provider.getSigner();

    const contractInstances = {
      nftCollateralLending: new ethers.Contract(
        CONTRACT_ADDRESSES.NFT_COLLATERAL_LENDING,
        NFT_COLLATERAL_LENDING_ABI,
        provider
      ),
      ammFactory: new ethers.Contract(
        CONTRACT_ADDRESSES.AMM_FACTORY,
        AMM_FACTORY_ABI,
        provider
      ),
      watchRegistry: new ethers.Contract(
        CONTRACT_ADDRESSES.WATCH_REGISTRY,
        WATCH_REGISTRY_ABI,
        provider
      ),
      usdc: new ethers.Contract(
        CONTRACT_ADDRESSES.USDC,
        ERC20_ABI,
        provider
      ),
      provider,
      getSigner,
      // Helper function to get AMM pool contract
      getAMMPool: (poolAddress) => new ethers.Contract(
        poolAddress,
        AMM_ABI,
        provider
      ),
      // Helper function to get fraction token contract
      getFractionToken: (tokenAddress) => new ethers.Contract(
        tokenAddress,
        WATCH_FRACTION_ABI,
        provider
      ),
      // Helper function to get contracts with signer for transactions
      withSigner: async () => {
        const signer = await getSigner();
        return {
          nftCollateralLending: new ethers.Contract(
            CONTRACT_ADDRESSES.NFT_COLLATERAL_LENDING,
            NFT_COLLATERAL_LENDING_ABI,
            signer
          ),
          ammFactory: new ethers.Contract(
            CONTRACT_ADDRESSES.AMM_FACTORY,
            AMM_FACTORY_ABI,
            signer
          ),
          watchRegistry: new ethers.Contract(
            CONTRACT_ADDRESSES.WATCH_REGISTRY,
            WATCH_REGISTRY_ABI,
            signer
          ),
          usdc: new ethers.Contract(
            CONTRACT_ADDRESSES.USDC,
            ERC20_ABI,
            signer
          ),
          getAMMPool: (poolAddress) => new ethers.Contract(
            poolAddress,
            AMM_ABI,
            signer
          ),
          getFractionToken: (tokenAddress) => new ethers.Contract(
            tokenAddress,
            WATCH_FRACTION_ABI,
            signer
          ),
        };
      },
    };

    return contractInstances;
  }, [walletClient]);

  return contracts;
}