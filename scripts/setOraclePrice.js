const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// Config & ABI paths
const config = require("../frontend/src/config.json");
const oracleAbi = require("../frontend/src/abi/Oracle.json");

// Hardcode network params
const networkUrl = "http://127.0.0.1:8545"; // localhost Hardhat
const oracleAddress = config["31337"].oracle.address;
const nftId = 2; // example NFT

// ✅ In ethers v6, use bigint
const priceWei = 21550000000000000000000n; // £11,750 in wei

async function main() {
  console.log("Oracle address:", oracleAddress);

  // Use default Hardhat local node signer
  const provider = new ethers.JsonRpcProvider(networkUrl);
  const signer = await provider.getSigner(0); // first account
  console.log("Using signer:", await signer.getAddress());

  const oracle = new ethers.Contract(oracleAddress, oracleAbi, signer);

  const tx = await oracle.setPrice(nftId, priceWei);
  console.log("Transaction sent. Waiting for confirmation...");
  await tx.wait();
  console.log(`✅ Price for NFT ${nftId} set to ${priceWei.toString()} wei`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
