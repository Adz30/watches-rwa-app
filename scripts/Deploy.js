const { ethers } = require("hardhat");


const tokens = (n) => ethers.parseUnits(n.toString(), 18);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // --- Deploy USDC Mock ---
  const TokenFactory = await ethers.getContractFactory("Standard_Token");
  const usdc = await TokenFactory.deploy(
    tokens(1_000_000),
    "USDC Mock",
    18,
    "USDC"
  );
  await usdc.waitForDeployment();
  console.log("USDC deployed to:", await usdc.getAddress());

  const deployerBalance = await usdc.balanceOf(deployer.address);
  console.log("Deployer USDC balance:", ethers.formatUnits(deployerBalance, 18));

  // --- Deploy Mock Oracle ---
  const MockOracleFactory = await ethers.getContractFactory("MockOracle");
  const oracle = await MockOracleFactory.deploy();
  await oracle.waitForDeployment();
  console.log("Oracle deployed to:", await oracle.getAddress());

  // --- Deploy NFT registry ---
  const WatchRegistryFactory = await ethers.getContractFactory("WatchRegistry");
  const watchNFT = await WatchRegistryFactory.deploy();
  await watchNFT.waitForDeployment();
  console.log("WatchNFT deployed to:", await watchNFT.getAddress());

  // --- Deploy NFTCollateralLending ---
  const collateralRatioBP = 8000; // 80%
  const interestRateBP = 200;    // 2%
  const LendingFactory = await ethers.getContractFactory("NFTCollateralLending");
  const lending = await LendingFactory.deploy(
    usdc.getAddress(),
    watchNFT.getAddress(),
    oracle.getAddress(),
    collateralRatioBP,
    interestRateBP
  );
  await lending.waitForDeployment();
  console.log("Lending deployed to:", await lending.getAddress());

  // --- Deploy WatchFraction implementation ---
  const WatchFractionFactory = await ethers.getContractFactory("WatchFraction");
  const fractionalizerImpl = await WatchFractionFactory.deploy();
  await fractionalizerImpl.waitForDeployment();
  console.log("Fraction implementation deployed to:", await fractionalizerImpl.getAddress());

  // --- Deploy FractionalizerFactory ---
  const FractionalizerFactoryFactory = await ethers.getContractFactory("WatchFractionalizerFactory");
  const fractionalizerFactory = await FractionalizerFactoryFactory.deploy(
    fractionalizerImpl.getAddress(),
    watchNFT.getAddress()
  );
  await fractionalizerFactory.waitForDeployment();
  console.log("FractionalizerFactory deployed to:", await fractionalizerFactory.getAddress());

  // --- Deploy AMMFactory ---
  const AMMFactoryFactory = await ethers.getContractFactory("AMMFactory");
  const factory = await AMMFactoryFactory.deploy(usdc.getAddress(), oracle.getAddress());
  await factory.waitForDeployment();
  console.log("AMMFactory deployed to:", await factory.getAddress());

  console.log("Deployment complete ✅");
  console.log({
    usdc: await usdc.getAddress(),
    oracle: await oracle.getAddress(),
    watchNFT: await watchNFT.getAddress(),
    lending: await lending.getAddress(),
    fractionalizerFactory: await fractionalizerFactory.getAddress(),
    fractionalizerImpl: await fractionalizerImpl.getAddress(),
    factory: await factory.getAddress(),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
