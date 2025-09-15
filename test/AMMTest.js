const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Full Watch Fractional AMM Flow", function () {
  let deployer, alice, bob;
  let usdc,
    oracle,
    watchNFT,
    fractionalizerFactory,
    fractionToken,
    fractionToken2,
    factory,
    pool;
  const watchId = 1;
  const watchId2 = 2;
  const totalFractions = ethers.parseUnits("1000", 18);
  const feeBps = 30; // 0.3%

  const ether = (n) => ethers.parseUnits(n.toString(), 18);

  before(async function () {
    [deployer, alice, bob] = await ethers.getSigners();

    // Deploy USDC Mock
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

    // Deploy MockOracle
    const MockOracleFactory = await ethers.getContractFactory(
      "MockOracle",
      deployer
    );
    oracle = await MockOracleFactory.deploy();
    await oracle.waitForDeployment();
    await oracle.setPrice(watchId, ethers.parseUnits("200", 18));
    await oracle.setPrice(watchId2, ethers.parseUnits("400", 18));

    // Deploy WatchRegistry
    const WatchRegistryFactory = await ethers.getContractFactory(
      "WatchRegistry",
      deployer
    );
    watchNFT = await WatchRegistryFactory.deploy();
    await watchNFT.waitForDeployment();
    await watchNFT.mintWatch(alice.address, "ipfs://dummy-uri-1");
    await watchNFT.mintWatch(bob.address, "ipfs://dummy-uri-2");

    // Deploy WatchFraction implementation
    const WatchFractionFactory = await ethers.getContractFactory(
      "WatchFraction",
      deployer
    );
    const fractionalizerImpl = await WatchFractionFactory.deploy();
    await fractionalizerImpl.waitForDeployment();

    // Deploy FractionalizerFactory
    const FractionalizerFactoryFactory = await ethers.getContractFactory(
      "WatchFractionalizerFactory",
      deployer
    );
    fractionalizerFactory = await FractionalizerFactoryFactory.deploy(
      fractionalizerImpl.target,
      watchNFT.target
    );
    await fractionalizerFactory.waitForDeployment();

    // --- Fractionalize first NFT (Alice) ---
    await watchNFT
      .connect(alice)
      .approve(fractionalizerFactory.target, watchId);
    await fractionalizerFactory
      .connect(alice)
      .fractionalize(watchId, totalFractions);
    const fractionTokenAddress = await fractionalizerFactory.getFractionalizer(
      watchId
    );
    fractionToken = await ethers.getContractAt(
      "WatchFraction",
      fractionTokenAddress
    );

    // --- Fractionalize second NFT (Bob) ---
    await watchNFT.connect(bob).approve(fractionalizerFactory.target, watchId2);
    await fractionalizerFactory
      .connect(bob)
      .fractionalize(watchId2, totalFractions);
    const fractionToken2Address = await fractionalizerFactory.getFractionalizer(
      watchId2
    );
    fractionToken2 = await ethers.getContractAt(
      "WatchFraction",
      fractionToken2Address
    );

    // Deploy AMMFactory and Pool
    const AMMFactoryFactory = await ethers.getContractFactory(
      "AMMFactory",
      deployer
    );
    factory = await AMMFactoryFactory.deploy(usdc.target, oracle.target);
    await factory.waitForDeployment();

    // Pool for first NFT (watchId)
    await factory.createPool(
      watchId,
      fractionToken.target,
      feeBps,
      deployer.address
    );
    const poolAddress = await factory.getPoolByWatch(watchId);
    pool = await ethers.getContractAt("AMM", poolAddress);

    // Pool for second NFT (watchId2)
    await factory.createPool(
      watchId2,
      fractionToken2.target,
      feeBps,
      deployer.address
    );
    const pool2Address = await factory.getPoolByWatch(watchId2);
    pool2 = await ethers.getContractAt("AMM", pool2Address);

    // Fund Alice and Bob with USDC
    await usdc.transfer(alice.address, ether(10000));
    await usdc.transfer(bob.address, ether(10000));
  });

  it("should deploy correctly", async function () {
    expect(fractionToken.target).to.not.equal(ethers.ZeroAddress);
    expect(fractionToken2.target).to.not.equal(ethers.ZeroAddress);
    expect(usdc.target).to.not.equal(ethers.ZeroAddress);
    expect(pool.target).to.not.equal(ethers.ZeroAddress);
    expect(pool2.target).to.not.equal(ethers.ZeroAddress);
  });
  describe("AMM Flow", function () {
    beforeEach(async function () {
      // Reset approvals before each test for both pools to be safe
      await usdc.connect(alice).approve(pool.target, ethers.MaxUint256);
      await fractionToken
        .connect(alice)
        .approve(pool.target, ethers.MaxUint256);
      await usdc.connect(bob).approve(pool.target, ethers.MaxUint256);

      await usdc.connect(bob).approve(pool2.target, ethers.MaxUint256);
      await fractionToken2
        .connect(bob)
        .approve(pool2.target, ethers.MaxUint256);
      await usdc.connect(alice).approve(pool2.target, ethers.MaxUint256);
    });

    it("Watch1: Alice provides liquidity, Bob swaps USDC for FRACTION, Alice swaps FRACTION for USDC", async function () {
      // transfer udsc to alice from deployer
      await usdc.transfer(alice.address, ether(100));

      // --- 1️⃣ Alice approves balances ---
      await usdc.connect(alice).approve(pool.target, ethers.MaxUint256);
      await fractionToken
        .connect(alice)
        .approve(pool.target, ethers.MaxUint256);

      // --- 2️⃣ Add liquidity (500 FRACTION + 10,000 USDC) ---
      await pool.connect(alice).addLiquidity(
        ethers.parseUnits("500", 18), // FRACTION
        ethers.parseUnits("10000", 18) // USDC
      );

      // --- 3️⃣ Bob swaps 100 USDC → FRACTION ---
      await usdc.connect(bob).approve(pool.target, ethers.MaxUint256);
      await pool.connect(bob).swapUSDCForFraction(
        ethers.parseUnits("100", 18), // input USDC
        0
      );

      const bobFractionBalance = await fractionToken.balanceOf(bob.address);

      expect(bobFractionBalance).to.be.gt(0);

      // --- 4️⃣ Alice swaps 5 FRACTION → USDC ---
      await pool.connect(alice).swapFractionForUSDC(
        ethers.parseUnits("5", 18), // input FRACTION
        0
      );

      const aliceUSDCBalance = await usdc.balanceOf(alice.address);

      expect(aliceUSDCBalance).to.be.gt(0);
    });

    it("Watch1: Alice provides liquidity", async function () {
      // --- Fetch pool balances BEFORE deposit ---
      const poolUSDCBefore = await usdc.balanceOf(pool.target);
      const poolFractionBefore = await fractionToken.balanceOf(pool.target);

      // --- Alice adds liquidity ---
      const fractionDeposit = ethers.parseUnits("495", 18);
      const usdcDeposit = ethers.parseUnits("995", 18);
      await pool.connect(alice).addLiquidity(fractionDeposit, usdcDeposit);

      // --- Fetch pool balances AFTER deposit ---
      const poolUSDCAfter = await usdc.balanceOf(pool.target);
      const poolFractionAfter = await fractionToken.balanceOf(pool.target);

      // Log Alice balances after
      const aliceUSDCBal = await usdc.balanceOf(alice.address);
      const aliceFractionBal = await fractionToken.balanceOf(alice.address);

      // Log decimals
      const usdcDecimals = await usdc.decimals();
      const fractionDecimals = await fractionToken.decimals();

      // --- Correct expected balances accounting for existing liquidity ---
      const expectedUSDC = poolUSDCBefore + usdcDeposit;
      const expectedFraction = poolFractionBefore + fractionDeposit;

      // Assertions with small tolerance
      expect(poolUSDCAfter).to.be.closeTo(
        expectedUSDC,
        ethers.parseUnits("0.001", 18)
      );
      expect(poolFractionAfter).to.be.closeTo(
        expectedFraction,
        ethers.parseUnits("0.001", 18)
      );
    });

    it("Watch1: Bob swaps USDC for FRACTION", async function () {
      // --- Fetch Alice balances ---
      const aliceF = await fractionToken.balanceOf(alice.address);
      const aliceU = await usdc.balanceOf(alice.address);

      // --- Seed liquidity with Alice's full balance ---
      await pool.connect(alice).addLiquidity(aliceF, aliceU);

      // --- Bob balances before swap ---
      const bobUSDCBefore = await usdc.balanceOf(bob.address);
      const bobFBefore = await fractionToken.balanceOf(bob.address);

      await usdc.connect(bob).approve(pool.target, ethers.MaxUint256);

      // --- Bob swap ---
      const usdcInput = ethers.parseUnits("1000", 18);
      await pool.connect(bob).swapUSDCForFraction(usdcInput, 0);

      const bobUSDCAfter = await usdc.balanceOf(bob.address);
      const bobFAfter = await fractionToken.balanceOf(bob.address);

      expect(bobFAfter).to.be.gt(bobFBefore);
      expect(bobUSDCAfter).to.be.lt(bobUSDCBefore);
    });

    it("Watch1: Full AMM Flow with detailed logging", async function () {
      // --- Initial allocations ---
      const aliceFractionAmount = ethers.parseUnits("500", 18);
      const aliceUSDCAmount = ethers.parseUnits("1000", 18);
      const bobUSDCAmount = ethers.parseUnits("10000", 18);
      await usdc.transfer(alice.address, ether(100000));

      // --- Transfer tokens to Alice and Bob ---
      // await fractionToken.connect(deployer).transfer(alice.address, aliceFractionAmount);
      await usdc.connect(deployer).transfer(alice.address, aliceUSDCAmount);
      await usdc.connect(deployer).transfer(bob.address, bobUSDCAmount);

      //alice swap usdc for fraction to get some fraction tokens
      await usdc.connect(alice).approve(pool.target, ethers.MaxUint256);
      await pool
        .connect(alice)
        .swapUSDCForFraction(ethers.parseUnits("100000", 18), 0);

      // --- Approvals ---
      await fractionToken
        .connect(alice)
        .approve(pool.target, ethers.MaxUint256);
      await usdc.connect(alice).approve(pool.target, ethers.MaxUint256);
      await usdc.connect(bob).approve(pool.target, ethers.MaxUint256);

      // --- Alice seeds liquidity ---
      const fractionDeposit = ethers.parseUnits("495", 18);
      const usdcDeposit = ethers.parseUnits("995", 18);
      await pool.connect(alice).addLiquidity(fractionDeposit, usdcDeposit);

      // --- Bob swaps USDC → FRACTION ---
      const bobUSDCInput = ethers.parseUnits("100", 18);
      const bobFractionBefore = await fractionToken.balanceOf(bob.address);
      const bobUSDCBefore = await usdc.balanceOf(bob.address);
      await pool.connect(bob).swapUSDCForFraction(bobUSDCInput, 0);

      // --- Alice swaps FRACTION → USDC ---
      const aliceFractionInput = ethers.parseUnits("3", 18);
      const aliceFractionBeforeSwap = await fractionToken.balanceOf(
        alice.address
      );
      const aliceUSDCBeforeSwap = await usdc.balanceOf(alice.address);
      const poolUSDCBeforeSwap = await usdc.balanceOf(pool.target);
      const poolFractionBeforeSwap = await fractionToken.balanceOf(pool.target);

      await pool.connect(alice).swapFractionForUSDC(aliceFractionInput, 0);

      // --- Assertions ---
      expect(await usdc.balanceOf(alice.address)).to.be.gt(aliceUSDCBeforeSwap);
      expect(await fractionToken.balanceOf(alice.address)).to.be.lt(
        aliceFractionBeforeSwap
      );
    });
    it("Watch2: Bob provides liquidity, Alice swaps USDC for FRACTION, bob swaps FRACTION for USDC", async function () {
      // transfer udsc to alice from deployer
      await usdc.transfer(bob.address, ether(100));

      // --- 1️⃣ bob approves balances ---
      await usdc.connect(bob).approve(pool2.target, ethers.MaxUint256);
      await fractionToken2
        .connect(bob)
        .approve(pool2.target, ethers.MaxUint256);

      // --- 2️⃣ Add liquidity (500 FRACTION + 10,000 USDC) ---
      await pool2.connect(bob).addLiquidity(
        ethers.parseUnits("500", 18), // FRACTION2
        ethers.parseUnits("10000", 18) // USDC
      );

      // --- 3️⃣ alice swaps 100 USDC → FRACTION ---
      await usdc.connect(alice).approve(pool2.target, ethers.MaxUint256);
      await pool2.connect(alice).swapUSDCForFraction(
        ethers.parseUnits("100", 18), // input USDC
        0
      );

      const aliceFractionBalance = await fractionToken.balanceOf(alice.address);

      expect(aliceFractionBalance).to.be.gt(0);

      // --- 4️⃣ Alice swaps 5 FRACTION → USDC ---
      await pool2.connect(bob).swapFractionForUSDC(
        ethers.parseUnits("5", 18), // input FRACTION
        0
      );

      const bobUSDCBalance = await usdc.balanceOf(bob.address);

      expect(bobUSDCBalance).to.be.gt(0);
    });
    it("Watch2: Bob provides liquidity", async function () {
      // --- Fetch pool2 balances BEFORE deposit ---
      const poolUSDCBefore = await usdc.balanceOf(pool2.target);
      const poolFractionBefore = await fractionToken2.balanceOf(pool2.target);

      // --- Bob adds liquidity ---
      const fractionDeposit = ethers.parseUnits("495", 18);
      const usdcDeposit = ethers.parseUnits("995", 18);
      await pool2.connect(bob).addLiquidity(fractionDeposit, usdcDeposit);

      // --- Fetch pool2 balances AFTER deposit ---
      const poolUSDCAfter = await usdc.balanceOf(pool2.target);
      const poolFractionAfter = await fractionToken2.balanceOf(pool2.target);

      // --- Correct expected balances accounting for existing liquidity ---
      const expectedUSDC = poolUSDCBefore + usdcDeposit;
      const expectedFraction = poolFractionBefore + fractionDeposit;

      expect(poolUSDCAfter).to.be.closeTo(
        expectedUSDC,
        ethers.parseUnits("0.001", 18)
      );
      expect(poolFractionAfter).to.be.closeTo(
        expectedFraction,
        ethers.parseUnits("0.001", 18)
      );
     
    });

    it("Watch2: Alice swaps USDC for FRACTION2", async function () {
      // --- Seed liquidity with Bob's full balance ---
      const bobF = await fractionToken2.balanceOf(bob.address);
      const bobU = await usdc.balanceOf(bob.address);
      
      await pool2.connect(bob).addLiquidity(bobF, bobU);

      // --- Alice balances before swap ---
      await usdc.transfer(alice.address, ether(1000));
      const aliceUSDCBefore = await usdc.balanceOf(alice.address);
      const aliceFBefore = await fractionToken2.balanceOf(alice.address);
      

      await usdc.connect(alice).approve(pool2.target, ethers.MaxUint256);

      // --- Alice swap ---
      const usdcInput = ethers.parseUnits("1000", 18);
      await pool2.connect(alice).swapUSDCForFraction(usdcInput, 0);

      const aliceUSDCAfter = await usdc.balanceOf(alice.address);
      const aliceFAfter = await fractionToken2.balanceOf(alice.address);

      expect(aliceFAfter).to.be.gt(aliceFBefore);
      expect(aliceUSDCAfter).to.be.lt(aliceUSDCBefore);
    });

    it("Watch2: Full AMM Flow with detailed logging", async function () {
  // --- Initial allocations ---
  const bobFractionAmount = 500n * 10n ** 18n; // 500 FRACTION2
  const aliceUSDCAmount = 1000n * 10n ** 18n; // 1000 USDC
  const bobUSDCAmount = 10000n * 10n ** 18n; // 10000 USDC

  // Transfer USDC to Alice and Bob
  await usdc.connect(deployer).transfer(alice.address, aliceUSDCAmount);
  await usdc.connect(deployer).transfer(bob.address, bobUSDCAmount);

  // --- Pool USDC before Alice swaps ---
  const pool2BalanceBefore = await usdc.balanceOf(pool2.target);

  // --- Alice swaps USDC for FRACTION2 ---
  const aliceUSDCInput = 1000n * 10n ** 18n;
  await usdc.connect(alice).approve(pool2.target, ethers.MaxUint256);
  await pool2.connect(alice).swapUSDCForFraction(aliceUSDCInput, 0);

  // --- Approvals for Bob and Alice ---
  await fractionToken2.connect(bob).approve(pool2.target, ethers.MaxUint256);
  await usdc.connect(alice).approve(pool2.target, ethers.MaxUint256);
  await usdc.connect(bob).approve(pool2.target, ethers.MaxUint256);



  // --- Alice swaps USDC → FRACTION2 ---
  const aliceUSDCSwap = 100n * 10n ** 18n;
  const aliceFractionBefore = await fractionToken2.balanceOf(alice.address);
  const aliceUSDCBefore = await usdc.balanceOf(alice.address);

  await usdc.connect(alice).approve(pool2.target, ethers.MaxUint256);
  await pool2.connect(alice).swapUSDCForFraction(aliceUSDCSwap, 0);

  const aliceFractionAfter = await fractionToken2.balanceOf(alice.address);
  const aliceUSDCAfter = await usdc.balanceOf(alice.address);



 

  // --- Assertions (using native bigint) ---
  expect(aliceFractionAfter > aliceFractionBefore).to.be.true;
  expect(aliceUSDCAfter < aliceUSDCBefore).to.be.true;


  // Pool balance check
  const pool2BalanceAfter = await usdc.balanceOf(pool2.target);
  expect(pool2BalanceAfter > pool2BalanceBefore).to.be.true;
});
  });
});
