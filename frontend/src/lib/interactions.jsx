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
  setDecimals,
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

import { setFactoryContract, setFactoryStatus, setFactoryData, setFactoryError,   setRedeemStatus,
  setRedeemError,  } from "../redux/reducers/fractionalizerFactorySlice";


import {
  setFractionalTokenData ,
  setFractionStatus,
  setFractionError,
} from "../redux/reducers/watchFractionSlice";



import { setAmmFactoryContract, setPoolContract, setPoolError, setPoolData } from "../redux/reducers/ammSlice";

import Standard_Token_ABI from "../abi/Standard_Token.json";
import Oracle_ABI from "../abi/Oracle.json";
import WatchRegistry_ABI from "../abi/WatchRegistry.json";
import Lending_ABI from "../abi/NFTCollateralLending.json";
import WatchFraction_ABI from "../abi/WatchFraction.json";
import FractionalizerFactory_ABI from "../abi/WatchFractionalizerFactory.json";
import AMM_ABI from "../abi/AMM.json";
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

    const decimals = await usdcContract.decimals();
    console.log("USDC decimals:", decimals);

    const balance = await usdcContract.balanceOf(account);
    const formattedBalance = ethers.utils.formatUnits(balance, 18);
    console.log("USDC balance:", formattedBalance);

    // Dispatch to tokenSlice
    dispatch(setContracts({ usdc: usdcContract }));
    dispatch(setSymbols({ usdc: symbol }));
    dispatch(setDecimals({ usdc: decimals }));
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

    if (!lendingContract || !usdcContract)
      throw new Error("Contracts not initialized");
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
    const allowance = await usdcContract.allowance(
      account,
      lendingContract.address
    );
    if (allowance.lt(repaymentBN)) {
      console.log("Approving USDC for repayment...");
      const approveTx = await usdcContract
        .connect(signer)
        .approve(lendingContract.address, repaymentBN);
      await approveTx.wait();
      console.log("✅ USDC approved for repayment");
    }

    // --- Repay loan ---
    console.log(
      `Repaying loan for NFT ${nftId} with ${repaymentBN.toString()} USDC`
    );
    const tx = await lendingContract.connect(signer).repayLoan(nftId);
    const receipt = await tx.wait();

    console.log(`Repayment amount for NFT ${nftId}:`, repaymentBN.toString());
    console.log("Approving USDC for repayment...");
    console.log(
      `Repaying loan for NFT ${nftId} with ${repaymentBN.toString()} USDC`
    );
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

  const signer = provider.getSigner(); // enable writes
  const contract = new Contract(address, FractionalizerFactory_ABI, signer);
  dispatch(setFactoryContract(contract));
  console.log("✅ FractionalizerFactory loaded:", contract);
  return contract;
};

//---------------------------
// load fraction contract
export const loadFractionContract = async (fractionAddress, provider, dispatch, nftId, account) => {
  if (!fractionAddress || fractionAddress === ethers.constants.AddressZero) return null;

  try {
    const contract = new ethers.Contract(fractionAddress, WatchFraction_ABI, provider.getSigner());
    const [totalSupply, balance, name, symbol] = await Promise.all([
      contract.totalSupply(),
      contract.balanceOf(account),
      contract.name(),
      contract.symbol(),
    ]);

    dispatch(setFractionalTokenData({
      nftId,
      fractionAddress,
      contract,
      totalSupply: totalSupply.toString(),
      balance: balance.toString(),
    }));

    console.log(`✅ Loaded fraction contract for NFT ${nftId}:`, fractionAddress);
    return contract;
  } catch (err) {
    console.error(`❌ Failed to load fraction contract for NFT ${nftId}:`, err);
    dispatch(setFractionError({ nftId, error: err.message || err.toString() }));
    return null;
  }
};



//-----------
// Load Fraction contract and data
export const loadFractionsForOwner = async (factoryContract, nftIds, provider, account, dispatch) => {
  if (!factoryContract || !nftIds?.length || !provider || !account) return;

  dispatch(setFractionStatus({ status: "loading" }));

  for (const tokenId of nftIds) {
    try {
      // 1️⃣ Get fraction address from factory
      const fractionAddress = await factoryContract.getFractionalizer(tokenId);
      if (!fractionAddress || fractionAddress === ethers.constants.AddressZero) {
        console.log(`❌ NFT ID ${tokenId} has no fractional token`);
        continue;
      }

      // 2️⃣ Connect to WatchFraction ERC20
      const signer = provider.getSigner();
      const fractionContract = new ethers.Contract(fractionAddress, WatchFraction_ABI, signer);

      // 3️⃣ Fetch total supply and user balance
      const [totalSupply, balance, name, symbol, decimals] = await Promise.all([
        fractionContract.totalSupply(),
        fractionContract.balanceOf(account),
        fractionContract.name(),
        fractionContract.symbol(),
        fractionContract.decimals()
      ]);

      // 4️⃣ Dispatch to Redux
      dispatch(setFractionalTokenData({
        nftId: tokenId,
        fractionAddress,
        contract: fractionContract,
        totalSupply: totalSupply.toString(),
        balance: balance.toString(),
        name,
        symbol,
        decimals
      }));

      console.log(`✅ Loaded fraction for NFT ID ${tokenId} at ${fractionAddress}`);
    } catch (err) {
      console.error(`❌ Failed to load fraction for NFT ID ${tokenId}:`, err);
      dispatch(setFractionError({ nftId: tokenId, error: err.message || err.toString() }));
    }
  }

  dispatch(setFractionStatus({ status: "success" }));
};


// ----------------------------

// Create fractions for a given NFT
export const fractionalizeNFT = async (
  factoryContract,
  nftContract,
  dispatch,
  tokenId,
  totalShares,
  account,
  provider
) => {
  if (!factoryContract) throw new Error("Factory contract not loaded");
  if (!nftContract) throw new Error("NFT contract not loaded");
  if (!account) throw new Error("Account not provided");

  try {
    console.log("🔵 Starting fractionalization...");
    console.log("   factoryContract:", factoryContract.address);
    console.log("   nftContract:", nftContract.address);
    console.log("   tokenId:", tokenId);
    console.log("   totalShares:", totalShares);
    console.log("   account:", account);

    dispatch(setFactoryStatus({ tokenId, status: "loading" }));

    // 1. Approve the factory to transfer this NFT
    console.log("🔵 Approving factory to transfer NFT...");
    const approveTx = await nftContract.approve(factoryContract.address, tokenId);
    await approveTx.wait();
    console.log("✅ NFT approved");

    // 2. Fractionalize
    console.log("🔵 Calling factoryContract.fractionalize...");
    const tx = await factoryContract.fractionalize(tokenId, totalShares);
    console.log("✅ Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed:", receipt.transactionHash);

    // 3. Get fractionalizer address
    console.log("🔵 Fetching new fractionalizer address...");
    const newFractionAddress = await factoryContract.getFractionalizer(tokenId);
    console.log("✅ New fractionalizer address:", newFractionAddress);

    // 4. Load fraction contract
    await loadFractionContract(newFractionAddress, provider, dispatch, tokenId, account);

    // 5. Refresh fractions owned by account
    await loadFractionsForOwner(factoryContract, [tokenId], provider, account, dispatch);

    // 6. Refresh NFTs
    await dispatch(getUserNFTsWithMetadata());

    dispatch(setFactoryStatus({ tokenId, status: "success" }));
    console.log("✅ Fractionalization complete!");

    return newFractionAddress;
  } catch (err) {
    console.error("❌ Fractionalize failed:", err);
    dispatch(setFactoryError({ tokenId, error: err.message || "Transaction failed" }));
    throw err;
  }
};





export const redeemNFT = async (factoryContract, tokenId, account, provider, dispatch) => {
  if (!factoryContract || !account) {
    const errMsg = "Missing factory contract or account";
    dispatch(setRedeemError({ tokenId, error: errMsg }));
    throw new Error(errMsg);
  }

  try {
    dispatch(setRedeemStatus({ tokenId, status: "loading" }));

    const tx = await factoryContract.redeem(tokenId);
    const receipt = await tx.wait();
    console.log("✅ NFT redeemed:", receipt.transactionHash);

    // ✅ Clear fractionalizer data in Redux
    dispatch(setFractionalTokenData({
      nftId: tokenId,
      fractionAddress: null,
      contract: null,
      totalSupply: null,
      balance: null
    }));

    // ✅ Refresh NFTs for this account
    await dispatch(getUserNFTsWithMetadata());

    // ✅ Reload fraction balances (should be zero now)
    await loadFractionsForOwner(factoryContract, [tokenId], provider, account, dispatch);

    dispatch(setRedeemStatus({ tokenId, status: "success" }));
    return receipt;
  } catch (err) {
    console.error(`❌ Redeem failed for NFT ID ${tokenId}:`, err);
    dispatch(setRedeemError({ tokenId, error: err.message || "Redeem transaction failed" }));
    return null;
  }
};

// ----------------------------
// Load AMM Factory
export const loadAmmFactory = async (provider, account, dispatch, address) => {
  if (!provider || !account) return;

  const signer = provider.getSigner(account);
  const ammFactoryContract = new Contract(address, AmmFactory_ABI, signer);

  dispatch(setAmmFactoryContract(ammFactoryContract));
  console.log("✅ AMM Factory loaded with signer:", address);

  return ammFactoryContract;
};

// --------------------
// Check for existing pool
// --------------------
export const checkExistingPool = async (ammFactoryContract, fractionAddress, account, provider, dispatch) => {
  if (!ammFactoryContract || !fractionAddress || !account || !provider) return null;

  try {
    const poolAddress = await ammFactoryContract.getPoolByFraction(fractionAddress);

    if (!poolAddress || poolAddress === ethers.constants.AddressZero) {
      console.log("⚠️ No pool exists yet for fraction:", fractionAddress);
      return null;
    }

    console.log("✅ Existing pool found:", poolAddress);

    const poolContract = new ethers.Contract(poolAddress, AMM_ABI, provider.getSigner(account));
    dispatch(setPoolContract({ fractionAddress, poolContract }));

    // Optionally load balances immediately
    try {
      const [fractionBalance, usdcBalance, totalShares, feeBps] = await Promise.all([
        poolContract.fractionBalance(),
        poolContract.usdcBalance(),
        poolContract.totalShares(),
        poolContract.feeBps()
      ]);

      dispatch(setPoolData({
        poolAddress,
        data: {
          fractionAddress,
          poolAddress,
          fractionBalance: fractionBalance.toString(),
          usdcBalance: usdcBalance.toString(),
          totalShares: totalShares.toString(),
          feeBps: feeBps.toString(),
          loading: false,
          error: null
        }
      }));
    } catch (err) {
      console.error("❌ Failed to load balances for existing pool:", err);
      dispatch(setPoolError({ poolAddress, error: err.message || "Failed to load balances" }));
    }

    return poolContract;
  } catch (err) {
    console.error("❌ Failed to check existing pool:", err);
    dispatch(setPoolError({ poolAddress: fractionAddress, error: err.message || "Failed to fetch pool" }));
    return null;
  }
};
// ---------------------------
// Get pool address by fraction token
// ---------------------------



export const getPoolByFraction = async ({
  ammFactoryContract,
  fractionAddress,
  watchId,
  provider,
  account,
  dispatch,
  loadBalances = true,
}) => {
  if (!ammFactoryContract || !fractionAddress || !provider || !account) return null;

  let poolAddress;


  try {
    // Try fraction -> pool mapping first
    poolAddress = await ammFactoryContract.getPoolByFraction(fractionAddress);

    // Fallback: use watchId -> pool mapping if fraction mapping is empty
    if (!poolAddress || poolAddress === ethers.constants.AddressZero) {
      console.warn("⚠️ fractionToPool empty, falling back to watchIdToPool");
      poolAddress = await ammFactoryContract.getPoolByWatch(watchId);

      if (!poolAddress || poolAddress === ethers.constants.AddressZero) {
        console.warn("⚠️ No pool exists for this fraction/watchId yet:", fractionAddress, watchId);
        dispatch(setPoolError({ poolAddress: fractionAddress, error: "No pool deployed yet" }));
        return null;
      }
    }



    // Create pool contract with signer
    const poolContract = new ethers.Contract(poolAddress, AMM_ABI, provider.getSigner(account));
    dispatch(setPoolContract({ fractionAddress, poolContract }));

    // Optionally load balances
    if (loadBalances) {
      try {
        const [fractionBalance, usdcBalance, totalShares, feeBps] = await Promise.all([
          poolContract.fractionBalance(),
          poolContract.usdcBalance(),
          poolContract.totalShares(),
          poolContract.feeBps(),
        ]);

        dispatch(setPoolData({
          poolAddress,
          data: {
            fractionAddress,
            poolAddress,
            fractionBalance: fractionBalance.toString(),
            usdcBalance: usdcBalance.toString(),
            totalShares: totalShares.toString(),
            feeBps: feeBps.toString(),
            loading: false,
            error: null,
          },
        }));
      } catch (err) {
        console.error("❌ Failed to load pool balances:", err);
        dispatch(setPoolError({ poolAddress, error: err.message || "Failed to load balances" }));
      }
    }

    return poolContract;
  } catch (err) {
    console.error("❌ Failed to get pool:", err);
    dispatch(setPoolError({ poolAddress: fractionAddress, error: err.message || "Failed to fetch pool" }));
    return null;
  }
};


export const loadPoolInfo = async (poolAddress, account, provider, dispatch) => {
  if (!poolAddress || !provider || !account) {
    const errMsg = "Missing poolAddress, provider, or account";
    if (dispatch) dispatch(setPoolError({ poolAddress, error: errMsg }));
    throw new Error(errMsg);
  }

  try {
    const poolContract = new ethers.Contract(poolAddress, AMM_ABI, provider);

    // Read balances
    const [fractionBalance, usdcBalance, totalShares, feeBps] = await Promise.all([
      poolContract.balanceOf(account),
      poolContract.getUSDCBalance(), // adjust according to your AMM contract
      poolContract.totalShares(),
      poolContract.feeBps()
    ]);

    const info = {
      fractionBalance: ethers.utils.formatUnits(fractionBalance, 18),
      usdcBalance: ethers.utils.formatUnits(usdcBalance, 6), // assuming USDC decimals
      totalShares: ethers.utils.formatUnits(totalShares, 18),
      feeBps: feeBps.toNumber()
    };

    return info;
  } catch (err) {
    console.error("❌ Failed to load pool info:", err);
    if (dispatch) dispatch(setPoolError({ poolAddress, error: err.message || "Failed to load pool info" }));
    throw err;
  }
};

export const deployPool = async (ammFactoryContract, fractionAddress, account, provider, dispatch, watchId) => {
  if (!ammFactoryContract || !fractionAddress || !account || !provider) {
    const errMsg = "Missing required argument for pool deployment";
    dispatch(setPoolError({ poolAddress: fractionAddress, error: errMsg }));
    throw new Error(errMsg);
  }

  try {
    console.log("🔵 Deploying new AMM pool...");

    const tx = await ammFactoryContract.createPool(
      watchId,           
      fractionAddress,   
      30,                
      account            
    );
    console.log("✅ Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Pool deployment confirmed:", receipt.transactionHash);

    const event = receipt.events.find(e => e.event === "PoolCreated");
    if (!event) throw new Error("PoolCreated event not emitted");

    const poolAddress = event.args.pool;
    console.log("🏁 Pool deployed at:", poolAddress);

    // Create pool contract with signer for later transactions
    const poolContractWithSigner = new ethers.Contract(poolAddress, AMM_ABI, provider.getSigner(account));

    // Update Redux: pool contract (for transactions) and pools data (for display)
    dispatch(setPoolContract({
      watchId,
      poolContract: poolContractWithSigner
    }));

    dispatch(setPoolData({
      poolAddress,
      data: {
        fractionAddress,
        poolAddress,
        fractionBalance: "0",
        usdcBalance: "0",
        totalShares: "0",
        feeBps: 30,
        loading: true,
        error: null
      }
    }));

    // Load actual pool balances
    await dispatch(loadPoolInfo({ poolAddress, account, provider }));

    return poolAddress;
  } catch (err) {
    console.error("❌ Pool deployment failed:", err);
    dispatch(setPoolError({ poolAddress: fractionAddress, error: err.message || "Pool deployment failed" }));
    throw err;
  }
};





export const calculateUSDC = async (
  watchId,
  fractionAmount,       // human-readable number like 100
  watchFractionData,
  oraclePrices,
  usdcDecimals
) => {
  const fractionData = watchFractionData[String(watchId)];
  if (!fractionData) throw new Error(`No fraction data for watchId ${watchId}`);

  const totalSupplyBN = ethers.BigNumber.from(fractionData.totalSupply.toString());
  const fractionDecimals = fractionData.decimals || 18;

  // Parse fraction amount properly
  const fractionAmountParsed = ethers.utils.parseUnits(fractionAmount.toString(), fractionDecimals);

  if (!oraclePrices || !oraclePrices[watchId]) {
    throw new Error(`No oracle price available for watchId ${watchId}`);
  }
  const oraclePriceBN = ethers.BigNumber.from(oraclePrices[watchId]); // full NFT price in 18 decimals

  // Step 1: price in 18 decimals
  const rawUSDC18 = oraclePriceBN.mul(fractionAmountParsed).div(totalSupplyBN);

  // Step 2: rescale to actual USDC decimals
  const usdcAmountBN = ethers.utils.parseUnits(
    ethers.utils.formatUnits(rawUSDC18, 18), // convert 18-dec result to string
    usdcDecimals                              // scale to USDC decimals
  );

  console.log(`Fraction amount (human): ${fractionAmount}`);
  console.log(`Fraction amount parsed: ${fractionAmountParsed.toString()}`);
  console.log(`Oracle price raw (full NFT): ${oraclePriceBN.toString()}`);
  console.log(`Raw USDC@18dec: ${rawUSDC18.toString()}`);
  console.log(`USDC amount (BigNumber for contract): ${usdcAmountBN.toString()}`);
  console.log(`USDC amount (human): ${ethers.utils.formatUnits(usdcAmountBN, usdcDecimals)}`);

  return usdcAmountBN;
};

export const addLiquidity = async (
  poolContract,
  usdcTokenContract,
  fractionTokenContract,
  fractionAmount, // BigNumber
  account,
  usdcAmount // BigNumber calculated from oracle
) => {
  if (!poolContract || !usdcTokenContract || !fractionTokenContract || !account || !usdcAmount) {
    throw new Error("Missing required contracts, account, or USDC amount");
  }

  const fractionDecimals = await fractionTokenContract.decimals();
  const usdcDecimals = await usdcTokenContract.decimals();

  console.log("▶️ addLiquidity called with:");
  console.log("Fraction (BN):", fractionAmount.toString(), "| Human:", ethers.utils.formatUnits(fractionAmount, fractionDecimals));
  console.log("USDC (BN):", usdcAmount.toString(), "| Human:", ethers.utils.formatUnits(usdcAmount, usdcDecimals));

  // Approvals
  const usdcAllowance = await usdcTokenContract.allowance(account, poolContract.address);
  if (usdcAllowance.lt(usdcAmount)) {
    const tx = await usdcTokenContract.approve(poolContract.address, usdcAmount);
    await tx.wait();
    console.log("✅ USDC approved");
  }

  const fractionAllowance = await fractionTokenContract.allowance(account, poolContract.address);
  if (fractionAllowance.lt(fractionAmount)) {
    const tx = await fractionTokenContract.approve(poolContract.address, fractionAmount);
    await tx.wait();
    console.log("✅ Fraction approved");
  }

  // Add liquidity
  const tx = await poolContract.addLiquidity(fractionAmount, usdcAmount);
  const receipt = await tx.wait();
  console.log("✅ Liquidity added:", receipt.transactionHash);

  return receipt;
};

export const swap = async ({
  poolContract,
  fromToken,             // "USDC" or "FRACTION"
  amount,                // BigNumber
  account,
  usdcTokenContract,
  fractionTokenContract,
  usdcDecimals
}) => {
  if (!poolContract || !account || !amount) throw new Error("Missing required params");

  const fractionDecimals = await fractionTokenContract.decimals();
  console.log(`Fraction decimals: ${fractionDecimals}`);
  console.log(`USDC decimals: ${usdcDecimals}`);
  console.log(`usdcTokenContract: ${usdcTokenContract.address}`);
  console.log(`fractionTokenContract: ${fractionTokenContract.address}`);
  console.log(`poolContract: ${poolContract.address}`);
  console.log(`fromToken: ${fromToken}`);
  console.log(`amount (BN): ${amount.toString()}`);
  console.log(`amount (human): ${fromToken === "USDC" ? ethers.utils.formatUnits(amount, usdcDecimals) : ethers.utils.formatUnits(amount, fractionDecimals)}`);

  // Approve tokens if needed
  if (fromToken === "USDC") {
    const allowance = await usdcTokenContract.allowance(account, poolContract.address);
    if (allowance.lt(amount)) {
      const tx = await usdcTokenContract.approve(poolContract.address, amount);
      await tx.wait();
      console.log("✅ USDC approved for swap");
    }

    // Execute swap
    const tx = await poolContract.swapUSDCForFraction(amount, 0); // minFractionOut = 0
    const receipt = await tx.wait();

    // Extract Swap event to get actual fraction output
    const swapEvent = receipt.events.find(e => e.event === "Swap");
    if (swapEvent) {
      const fractionOut = swapEvent.args.amountGet;
      console.log("💠 Fraction output (wei):", fractionOut.toString());
      console.log("💠 Fraction output (human):", ethers.utils.formatUnits(fractionOut, fractionDecimals));
    }

    return receipt;
  }

  if (fromToken === "FRACTION") {
    const allowance = await fractionTokenContract.allowance(account, poolContract.address);
    if (allowance.lt(amount)) {
      const tx = await fractionTokenContract.approve(poolContract.address, amount);
      await tx.wait();
      console.log("✅ Fraction approved for swap");
    }

    // Execute swap
    const tx = await poolContract.swapFractionForUSDC(amount, 0); // minUsdcOut = 0
    const receipt = await tx.wait();

    // Extract Swap event to get actual USDC output
    const swapEvent = receipt.events.find(e => e.event === "Swap");
    if (swapEvent) {
      const usdcOut = swapEvent.args.amountGet;
      console.log("💠 USDC output (wei):", usdcOut.toString());
      console.log("💠 USDC output (human):", ethers.utils.formatUnits(usdcOut, usdcDecimals));
    }

    return receipt;
  }

  throw new Error("Invalid fromToken type, must be 'USDC' or 'FRACTION'");
};