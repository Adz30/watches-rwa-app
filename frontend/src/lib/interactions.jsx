// frontend/src/store/interactions.jsx
import { ethers, Contract } from "ethers";
import {
  setProvider,
  setNetwork,
  setAccount,
} from "../redux/reducers/providerSlice";
import {
  setContracts,
  setSymbols,
  balancesLoaded,
} from "../redux/reducers/tokenSlice";
import {
  setOracleContract,
  setOraclePrice,
  setOracleError,
  setOracleLoading,
} from "../redux/reducers/oracleSlice";
import {
  setWatchNFTContract,
  setBalance,
  setOwnedTokens,
  setTokenURI,
  setTokenMetadata,
  setLoading,
  setError,
} from "../redux/reducers/watchNftSlice";
import {
  setLendingContract,
  setLendingData,
  setLoan,
  depositRequest,
  depositSuccess,
  depositFail,
  withdrawRequest,
  withdrawSuccess,
  withdrawFail,
  borrowRequest,
  borrowSuccess,
  borrowFail,
  setReadOnlyLendingContract,
  repayFail,
  repayRequest,
  repaySuccess,
} from "../redux/reducers/lendingSlice";

import { setFractionalizerFactoryContract } from "../redux/reducers/fractionalizerFactorySlice";
import { setFractionalizerContract } from "../redux/reducers/fractionalizerSlice";
import { setAMMFactoryContract } from "../redux/reducers/ammFactorySlice";
import Standard_Token_ABI from "../abi/Standard_Token.json";
import Oracle_ABI from "../abi/Oracle.json";
import WatchRegistry_ABI from "../abi/WatchRegistry.json";
import Lending_ABI from "../abi/NFTCollateralLending.json";
import FractionalizerFactory_ABI from "../abi/WatchFractionalizerFactory.json";
import Fractionalizer_ABI from "../abi/WatchFractionalizer.json";
import AmmFactory_ABI from "../abi/AmmFactory.json";
import config from "../config.json";

import axios from "axios";

// ----------------------------
// Load provider
export const loadProvider = (dispatch) => {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  dispatch(setProvider(provider));
  return provider;
};

// ----------------------------
// Load network
export const loadNetwork = async (provider, dispatch) => {
  const { chainId } = await provider.getNetwork();
  dispatch(setNetwork(chainId));
  return chainId;
};

// ----------------------------
// Load account
export const loadAccount = async (dispatch) => {
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const account = ethers.utils.getAddress(accounts[0]);
  dispatch(setAccount(account));
  return account;
};

// ----------------------------
// Load USDC token

export const loadUSDC = async (provider, chainId, account, dispatch) => {
  try {
    const signer = provider.getSigner(account);

    const usdcContract = new ethers.Contract(
      config[chainId].usdc.address,
      Standard_Token_ABI,
      signer
    );

    const symbol = await usdcContract.symbol();
    console.log("✅ USDC loaded:", { contract: usdcContract, symbol });
    console.log("contract", usdcContract);

    const balance = await usdcContract.balanceOf(account);
    const formattedBalance = ethers.utils.formatUnits(balance, 18);
    console.log("USDC balance:", formattedBalance);

    // Dispatch to tokenSlice
    dispatch(setContracts({ usdc: usdcContract }));
    dispatch(setSymbols({ usdc: symbol }));
    dispatch(balancesLoaded({ usdc: formattedBalance }));

    return usdcContract;
  } catch (err) {
    console.error("❌ Error loading USDC:", err);
    dispatch(balancesLoaded({ usdc: 0 }));
  }
};

// ----------------------------
// Load Oracle
export const loadOracle = async (provider, dispatch, address) => {
  if (!provider) return;
  const contract = new Contract(address, Oracle_ABI, provider);
  dispatch(setOracleContract(contract)); // store actual contract, not just addr
  console.log("✅ Oracle loaded:", address);
  return contract;
}; // ----------------------------
// Fetch and store price for a given tokenId
// ----------------------------
export const loadOraclePrice =
  (tokenId, oracleContract) => async (dispatch) => {
    if (!oracleContract) {
      console.warn("❌ Oracle contract not available");
      return;
    }

    try {
      console.log(`⏳ Fetching fresh price for tokenId ${tokenId}...`);
      const price = await oracleContract.getPrice(tokenId);
      console.log(`✅ Fresh price for tokenId ${tokenId}:`, price.toString());

      dispatch(
        setOraclePrice({ tokenId: tokenId.toString(), price: price.toString() })
      );
    } catch (err) {
      console.error(`❌ Error fetching price for tokenId ${tokenId}:`, err);
      dispatch(setOracleError(err.message));
    }
  };

// ----------------------------
// Load WatchNFT
export const loadWatchNFT = async (provider, dispatch, address) => {
  if (!provider) return;
  const signer = provider.getSigner();
  const contract = new Contract(address, WatchRegistry_ABI, signer);
  console.log("Contract functions:", Object.keys(contract.functions));
  dispatch(setWatchNFTContract(contract));
  console.log("✅ WatchNFT loaded:", contract.address);
  return contract;
};

//upload metadata to ipfs
export const uploadMetadataToIPFS = async (metadata) => {
  try {
    const res = await fetch("http://localhost:4000/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) throw new Error("Failed to upload metadata");

    const data = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`;
  } catch (err) {
    console.error("❌ Error uploading metadata to IPFS via server:", err);
    throw err;
  }
};

// Mint NFT on-chain

export const mintWatchNFT = async (watchNFTContract, account, metadataURI) => {
  if (!watchNFTContract || !account)
    throw new Error("Contract or account missing");

  console.log("signer address:", await watchNFTContract.signer.getAddress());
  console.log("watchNFT.address:", watchNFTContract.address);

  console.log("🔹 Minting NFT with the following params:");
  console.log("Account:", account);
  console.log("Metadata URI:", metadataURI);

  try {
    const tx = await watchNFTContract.mintWatch(account, metadataURI);
    await tx.wait();
    console.log("✅ NFT minted!", tx);
    return tx;
  } catch (err) {
    console.error("❌ Error minting NFT:", err);
    throw err;
  }
};

// Get balance of NFTs for an account
export const getNFTBalance = async (provider, contractAddress, account) => {
  const contract = new Contract(contractAddress, WatchRegistry_ABI, provider);
  try {
    const balance = await contract.balanceOf(account);
    return balance.toNumber();
  } catch (err) {
    console.error("❌ Error fetching NFT balance:", err);
    throw err;
  }
};

// Get owner of a specific tokenId
export const getNFTOwner = async (provider, contractAddress, tokenId) => {
  const contract = new Contract(contractAddress, WatchRegistry_ABI, provider);
  try {
    const owner = await contract.ownerOf(tokenId);
    return owner;
  } catch (err) {
    console.error("❌ Error fetching NFT owner:", err);
    throw err;
  }
};

// Get token URI for a specific tokenId
export const getNFTTokenURI = async (provider, contractAddress, tokenId) => {
  const contract = new Contract(contractAddress, WatchRegistry_ABI, provider);
  try {
    const uri = await contract.tokenURI(tokenId);
    return uri;
  } catch (err) {
    console.error("❌ Error fetching tokenURI:", err);
    throw err;
  }
};

// Fetch all token IDs and metadata URIs for a given account
export const getUserNFTs = async (provider, contractAddress, account) => {
  try {
    const contract = new Contract(contractAddress, WatchRegistry_ABI, provider);

    // Get all token IDs for this account
    const tokenIds = await contract.tokensOfOwner(account);

    // Fetch metadata URIs for each token
    const nfts = await Promise.all(
      tokenIds.map(async (id) => {
        const uri = await contract.tokenURI(id);
        return { tokenId: id.toNumber(), uri };
      })
    );

    return nfts;
  } catch (err) {
    console.error("❌ Error fetching user NFTs:", err);
    throw err;
  }
};
// List of public IPFS gateways to try in order
const gateways = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://tan-top-impala-530.mypinata.cloud/ipfs/", // your custom gateway
];

export const fetchNFTMetadata = async (tokenURI) => {
  try {
    let cid;

    if (tokenURI.startsWith("ipfs://")) {
      // case: ipfs://bafy...
      cid = tokenURI.replace("ipfs://", "");
    } else if (tokenURI.includes("/ipfs/")) {
      // case: https://gateway.pinata.cloud/ipfs/bafy...
      cid = tokenURI.split("/ipfs/")[1];
    } else {
      // fallback: already a direct https URL
      const res = await fetch(tokenURI);
      if (res.ok) return await res.json();
      throw new Error(`Direct fetch failed: ${tokenURI}`);
    }

    // Now try all gateways with the normalized CID
    for (const gateway of gateways) {
      const url = `${gateway}${cid}`;
      try {
        const res = await fetch(url, { mode: "cors" });
        if (res.ok) {
          const metadata = await res.json();
          console.log(`✅ Metadata loaded from: ${url}`);
          return metadata;
        } else {
          console.warn(
            `⚠️ Gateway responded with error: ${url} (${res.status})`
          );
        }
      } catch (err) {
        console.warn(`⚠️ Gateway failed: ${url}`, err.message);
      }
    }

    throw new Error("All gateways failed to fetch NFT metadata");
  } catch (err) {
    console.error("❌ Error fetching NFT metadata:", err);
    return null;
  }
};

// Fetch all NFTs with metadata for a given account
export const getUserNFTsWithMetadata = () => async (dispatch, getState) => {
  const { account } = getState().provider; // make sure you use provider slice
  const { contract } = getState().watchNft;

  if (!contract || !account) return;
  console.log("Contract available:", contract);
  console.log("Has tokensOfOwner:", typeof contract.tokensOfOwner);

  try {
    // Use the tokensOfOwner function instead of balanceOf/tokenOfOwnerByIndex
    const tokenIds = await contract.tokensOfOwner(account); // returns uint256[]

    const ownedTokens = [];
    for (let tokenId of tokenIds) {
      tokenId = tokenId.toString();
      ownedTokens.push(tokenId);

      const tokenURI = await contract.tokenURI(tokenId);
      dispatch(setTokenURI({ tokenId, uri: tokenURI }));

      const metadata = await fetchNFTMetadata(tokenURI);
      if (metadata) {
        dispatch(setTokenMetadata({ tokenId, metadata }));
      }
    }

    dispatch(setOwnedTokens(ownedTokens));
    dispatch(setBalance(ownedTokens.length));
    dispatch(setLoading(false));
  } catch (err) {
    console.error("❌ Error fetching NFTs with metadata:", err);
    dispatch(setError(err.message));
    dispatch(setLoading(false));
  }
};

// ----------------------------
// Load Lending
export const loadLending = async (provider, dispatch, address, account) => {
  if (!provider || !account) return;

  const signer = provider.getSigner(account);

  const contract = new Contract(address, Lending_ABI, signer);
  const readOnlyContract = new Contract(address, Lending_ABI, provider);

  dispatch(setLendingContract(contract));
  dispatch(setReadOnlyLendingContract(readOnlyContract));

  console.log("✅ Lending loaded (signer & read-only):", address);
  return contract;
};
// ----------------------------
// Load lending pool data
export const loadLendingData = async (lendingContract, account, dispatch) => {
  if (!lendingContract) return;

  // get raw values from contract
  const [totalPoolUSDCBN, totalSharesBN] = await lendingContract.getPoolInfo();

  let userShares = { shares: "0", usdcValue: "0" };
  if (account) {
    const lender = await lendingContract.getLender(account);

    userShares = {
      shares: ethers.utils.formatUnits(lender.shares, 18),
      usdcValue: ethers.utils.formatUnits(lender.usdcValue, 18),
    };
  }
  dispatch(
    setLendingData({
      totalPoolUSDC: ethers.utils.formatUnits(totalPoolUSDCBN, 18),
      totalShares: ethers.utils.formatUnits(totalSharesBN, 18),
      userShares,
    })
  );
};
export const fetchUserLoansWithRepayment = async (
  lendingContract,
  nftIds,
  account,
  dispatch
) => {
  if (!lendingContract || !nftIds || !account) return [];

  const results = await Promise.all(
    nftIds.map(async (nftId) => {
      try {
        const [borrower, borrowedAmountBN, repaid] =
          await lendingContract.getLoan(nftId);
        if (borrower.toLowerCase() !== account.toLowerCase()) return null;

        let repayment = "0";
        if (!repaid) {
          repayment = (
            await lendingContract.getRepaymentAmount(nftId)
          ).toString();
        }

        const loanData = {
          nftId: nftId.toString(),
          borrower,
          borrowedAmount: borrowedAmountBN.toString(),
          repaid,
          repayment,
        };

        dispatch(setLoan(loanData));
        return loanData;
      } catch (err) {
        console.error(`Failed to fetch loan for NFT ${nftId}:`, err);
        return null;
      }
    })
  );

  return results.filter(Boolean); // remove nulls
};

export const borrowNFT = async (
  lendingContract,
  nftContract,
  nftId,
  signer,
  dispatch
) => {
  try {
    // Dispatch request start
    dispatch(borrowRequest());

    // Initialize signer if not provided
    if (!signer) {
      if (!window.ethereum) throw new Error("MetaMask not found");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
    }

    if (!lendingContract || !nftContract)
      throw new Error("Contracts not initialized");

    // Approve NFT if not already approved
    const approved = await nftContract.getApproved(nftId);
    if (approved.toLowerCase() !== lendingContract.address.toLowerCase()) {
      console.log(`Approving NFT ${nftId} for lending contract...`);
      const approvalTx = await nftContract
        .connect(signer)
        .approve(lendingContract.address, nftId);
      await approvalTx.wait();
      console.log("✅ NFT approved");
    } else {
      console.log("NFT already approved for lending contract");
    }

    // Deposit NFT and borrow
    console.log(`Depositing NFT ${nftId} and borrowing USDC...`);
    const tx = await lendingContract.connect(signer).depositNFTAndBorrow(nftId);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.transactionHash);

    // Extract borrowed amount from LoanTaken event
    const loanEvent = receipt.events.find((e) => e.event === "LoanTaken");
    if (!loanEvent) throw new Error("LoanTaken event not found");

    const { borrower, nftId: token, amount } = loanEvent.args;
    console.log(
      `✅ Borrowed ${ethers.utils.formatUnits(
        amount,
        18
      )} USDC for NFT ${token}`
    );

    // Dispatch success
    dispatch(
      borrowSuccess({
        nftId: token.toString(),
        borrowedAmount: amount.toString(),
      })
    );

    return amount;
  } catch (err) {
    console.error("❌ Error in borrowNFT:", err);
    dispatch(borrowFail(err.message));
    throw err;
  }
};

// ----------------------------
// Write functions
// ----------------------------
export const depositUSDC = async (
  lendingContract,
  usdcContract,
  account,
  amount,
  dispatch
) => {
  if (!account) throw new Error("No connected account");
  if (!lendingContract || !usdcContract)
    throw new Error("Contracts not loaded");

  try {
    dispatch(depositRequest());

    const provider = lendingContract.provider || usdcContract.provider;
    const signer = provider.getSigner(account);

    const lendingWithSigner = lendingContract.connect(signer);
    const usdcWithSigner = usdcContract.connect(signer);

    // Parse amount properly
    const decimals = await usdcWithSigner.decimals();
    const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);

    // Approve USDC
    const approveTx = await usdcWithSigner.approve(
      lendingWithSigner.address,
      amountWei
    );
    await approveTx.wait();

    // Deposit
    const depositTx = await lendingWithSigner.deposit(amountWei);
    await depositTx.wait();

    dispatch(depositSuccess(depositTx.hash));
    return depositTx;
  } catch (err) {
    console.error("❌ Deposit failed:", err);
    dispatch(depositFail(err.message));
    throw err;
  }
};

// ----------------------------
// Withdraw USDC with Redux dispatch
export const withdrawUSDC = async (
  lendingContract,
  account,
  amount,
  dispatch
) => {
  if (!account) throw new Error("No connected account");
  if (!lendingContract) throw new Error("Lending contract not loaded");

  try {
    dispatch(withdrawRequest());

    const provider = lendingContract.provider;
    const signer = provider.getSigner(account);
    const lendingWithSigner = lendingContract.connect(signer);

    // Parse amount assuming 18 decimals
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);

    const withdrawTx = await lendingWithSigner.withdraw(amountWei);
    await withdrawTx.wait();

    dispatch(withdrawSuccess(withdrawTx.hash));
    return withdrawTx;
  } catch (err) {
    console.error("❌ Withdraw failed:", err);
    dispatch(withdrawFail(err.message));
    throw err;
  }
};

// ----------------------------
// Repay NFT loan
export const repayLoan = async (
  lendingContract,
  usdcContract,
  nftId,
  account,
  dispatch
) => {
  try {
    dispatch(repayRequest(nftId));

    if (!lendingContract || !usdcContract) throw new Error("Contracts not initialized");
    if (!window.ethereum) throw new Error("MetaMask not found");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner(account);

    // --- Get repayment amount from contract ---
    let repayment = await lendingContract.getRepaymentAmount(nftId);
    if (!repayment) throw new Error("Repayment amount is undefined");

    const repaymentBN = ethers.BigNumber.isBigNumber(repayment)
      ? repayment
      : ethers.BigNumber.from(repayment);

    console.log(`Repayment amount for NFT ${nftId}:`, repaymentBN.toString());

    // --- Approve USDC if needed ---
    const allowance = await usdcContract.allowance(account, lendingContract.address);
    if (allowance.lt(repaymentBN)) {
      console.log("Approving USDC for repayment...");
      const approveTx = await usdcContract.connect(signer).approve(
        lendingContract.address,
        repaymentBN
      );
      await approveTx.wait();
      console.log("✅ USDC approved for repayment");
    }

    // --- Repay loan ---
    console.log(`Repaying loan for NFT ${nftId} with ${repaymentBN.toString()} USDC`);
    const tx = await lendingContract.connect(signer).repayLoan(nftId);
    const receipt = await tx.wait();

    console.log(`Repayment amount for NFT ${nftId}:`, repaymentBN.toString());
console.log("Approving USDC for repayment...");
console.log(`Repaying loan for NFT ${nftId} with ${repaymentBN.toString()} USDC`);
console.log("Transaction sent:", tx.hash);
console.log("Transaction confirmed:", receipt.transactionHash);

    // ✅ Dispatch success
    dispatch(
      repaySuccess({
        nftId,
        repaymentAmount: repaymentBN.toString(),
        transactionHash: tx.hash,
      })
    );

    return tx;
  } catch (err) {
    console.error("❌ Error in repayLoan:", err);
    dispatch(repayFail(err.message));
    throw err;
  }
};

// ----------------------------
// Load FractionalizerFactory
export const loadFractionalizerFactory = async (
  provider,
  dispatch,
  address
) => {
  if (!provider) return;
  const contract = new Contract(address, FractionalizerFactory_ABI, provider);
  dispatch(setFractionalizerFactoryContract(contract));
  console.log("✅ FractionalizerFactory loaded:", address);
  return contract;
};

// ----------------------------
// Load Fractionalizer implementation
export const loadFractionalizer = async (provider, dispatch, address) => {
  if (!provider) return;
  const contract = new Contract(address, Fractionalizer_ABI, provider);
  dispatch(setFractionalizerContract(contract));
  console.log("✅ Fractionalizer loaded:", address);
  return contract;
};

// ----------------------------
// Load AMM Factory
export const loadAmmFactory = async (provider, dispatch, address) => {
  if (!provider) return;
  const contract = new Contract(address, AmmFactory_ABI, provider);
  dispatch(setAMMFactoryContract(contract));
  console.log("✅ AMM Factory loaded:", address);
  return contract;
};
