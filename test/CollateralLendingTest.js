const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTCollateralLending", function () {
  let deployer, alice, bob;
  let usdc, oracle, watchNFT, lending;
  const nftId1 = 1;
  const nftId2 = 2;
  const collateralRatioBP = 8000; // 80%
  const interestRateBP = 200; // 2%
  const ether = (n) => ethers.parseUnits(n.toString(), 18);

  before(async function () {
    [deployer, alice, bob] = await ethers.getSigners();

    // --- Deploy USDC Mock ---
    const TokenFactory = await ethers.getContractFactory(
      "Standard_Token",
      deployer
    );
    usdc = await TokenFactory.deploy(
      ethers.parseUnits("1000000", 18),
      "USDC Mock",
      18,
      "USDC"
    );
    await usdc.waitForDeployment();

    // --- Deploy Mock Oracle ---
    const MockOracleFactory = await ethers.getContractFactory(
      "MockOracle",
      deployer
    );
    oracle = await MockOracleFactory.deploy();
    await oracle.waitForDeployment();
    await oracle.setPrice(nftId1, ether(200));
    await oracle.setPrice(nftId2, ether(400));

    // --- Deploy NFT contract ---
    const WatchRegistryFactory = await ethers.getContractFactory(
      "WatchRegistry",
      deployer
    );
    watchNFT = await WatchRegistryFactory.deploy();
    await watchNFT.waitForDeployment();
    await watchNFT.mintWatch(alice.address, "ipfs://dummy-uri-1");
    await watchNFT.mintWatch(bob.address, "ipfs://dummy-uri-2");

    // --- Deploy NFTCollateralLending ---
    const LendingFactory = await ethers.getContractFactory(
      "NFTCollateralLending",
      deployer
    );
    lending = await LendingFactory.deploy(
      usdc.target,
      watchNFT.target,
      oracle.target,
      collateralRatioBP,
      interestRateBP
    );
    await lending.waitForDeployment();

    // Fund Alice with USDC for lender tests
    await usdc.transfer(alice.address, ether(10000));
  });

  describe("Deployment", function () {
    it("should deploy contracts and set addresses correctly", async function () {
      expect(await lending.usdc()).to.equal(usdc.target);
      expect(await lending.nftContract()).to.equal(watchNFT.target);
      expect(await lending.oracle()).to.equal(oracle.target);
      expect(await lending.collateralRatioBP()).to.equal(collateralRatioBP);
      expect(await lending.interestRateBP()).to.equal(interestRateBP);
    });

    it("should have minted NFTs to Alice and Bob", async function () {
      expect(await watchNFT.ownerOf(nftId1)).to.equal(alice.address);
      expect(await watchNFT.ownerOf(nftId2)).to.equal(bob.address);
    });
  });

  describe("Lender Flow", function () {
    it("should allow Alice to deposit USDC", async function () {
      const depositAmount = ether(1000);
      await usdc.connect(alice).approve(lending.target, depositAmount);
      await lending.connect(alice).deposit(depositAmount);

      const aliceInfo = await lending.getLender(alice.address);
      expect(aliceInfo.shares).to.equal(depositAmount);
      expect(aliceInfo.usdcValue).to.equal(depositAmount);

      const poolInfo = await lending.getPoolInfo();
      expect(poolInfo._totalPoolUSDC).to.equal(depositAmount);
      expect(poolInfo._totalShares).to.equal(depositAmount);
    });

    it("should allow Alice to withdraw USDC", async function () {
      const sharesToWithdraw = ether(500);
      const aliceUSDCBefore = await usdc.balanceOf(alice.address);

      await lending.connect(alice).withdraw(sharesToWithdraw);

      const aliceInfo = await lending.getLender(alice.address);
      expect(aliceInfo.shares).to.equal(ether(500));

      const aliceUSDCAfter = await usdc.balanceOf(alice.address);
      expect(aliceUSDCAfter - aliceUSDCBefore).to.equal(sharesToWithdraw);

      const poolInfo = await lending.getPoolInfo();
      expect(poolInfo._totalPoolUSDC).to.equal(ether(500));
      expect(poolInfo._totalShares).to.equal(ether(500));
    });
    describe("Borrower Flow", function () {
      it("should allow Bob to take a loan using his NFT as collateral", async function () {
        const nftId = nftId2;
        const nftValue = await oracle.getPrice(nftId);
        const collateralRatio = BigInt(await lending.collateralRatioBP());
        const maxLoan = (nftValue * collateralRatio) / 10000n;

        await watchNFT.connect(bob).approve(lending.target, nftId);
        await lending.connect(bob).depositNFTAndBorrow(nftId);

        const [borrower, borrowedAmount, repaid] = await lending.getLoan(nftId);
        expect(borrower).to.equal(bob.address);
        expect(borrowedAmount).to.equal(maxLoan);
        expect(repaid).to.equal(false);
      });

      it("should allow Bob to repay the loan", async function () {
        const nftId = nftId2; // Bob's NFT

        // Get Bob's loan info before repayment
        const [borrower, borrowedAmount, repaid] = await lending.getLoan(nftId);

        // Calculate repayment amount with interest
        const repaymentAmount =
          borrowedAmount + (borrowedAmount * BigInt(interestRateBP)) / 10000n;

        // Fund Bob with USDC and approve
        await usdc.transfer(bob.address, repaymentAmount);
        await usdc.connect(bob).approve(lending.target, repaymentAmount);

        // Repay the loan
        await lending.connect(bob).repayLoan(nftId);

        // Check loan state after repayment
        const [borrowerAfter, borrowedAmountAfter, repaidAfter] =
          await lending.getLoan(nftId);

        // EXPECTATIONS
        expect(borrowerAfter).to.equal(bob.address); // loan still exists
        expect(borrowedAmountAfter).to.equal(borrowedAmount); // original borrowed amount
        expect(repaidAfter).to.equal(true); // now repaid

        // NFT returned to Bob
        expect(await watchNFT.ownerOf(nftId)).to.equal(bob.address);

        // Pool now includes Alice's remaining deposit + repayment
        const [totalPoolUSDC, totalShares] = await lending.getPoolInfo();
        expect(totalPoolUSDC).to.equal(ether(180) + repaymentAmount); // adjust based on earlier deposits/withdrawals
      });
    });

    describe("Lender Profit & Withdrawals", function () {
      it("should allow Alice to withdraw remaining USDC including interest from Bob's loan", async function () {
        // Alice currently has 500 shares remaining
        const aliceInfoBefore = await lending.getLender(alice.address);
        const aliceUSDCBefore = await usdc.balanceOf(alice.address);

        await lending.connect(alice).withdraw(aliceInfoBefore.shares);

        const aliceUSDCAfter = await usdc.balanceOf(alice.address);
        expect(aliceUSDCAfter - aliceUSDCBefore).to.equal(
          aliceInfoBefore.usdcValue
        );

        const aliceInfoAfter = await lending.getLender(alice.address);
        expect(aliceInfoAfter.shares).to.equal(0);

        const [totalPoolUSDC, totalShares] = await lending.getPoolInfo();
        expect(totalPoolUSDC).to.equal(0);
        expect(totalShares).to.equal(0);
      });
    });
  });
});
