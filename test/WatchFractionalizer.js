const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WatchFractionalizer Full Integration", function () {
  let WatchRegistry, watchRegistry;
  let WatchFraction, watchFractionImpl;
  let WatchFractionalizer, watchFractionalizer;
  let owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy WatchRegistry
    WatchRegistry = await ethers.getContractFactory("WatchRegistry");
    watchRegistry = await WatchRegistry.deploy();
    await watchRegistry.waitForDeployment();

    // Mint NFT #1 to Alice
    await watchRegistry
      .connect(owner)
      .mintWatch(alice.address, "ipfs://QmTestHash/rolex.json");

    // Deploy WatchFraction Implementation
    WatchFraction = await ethers.getContractFactory("WatchFraction");
    watchFractionImpl = await WatchFraction.deploy();
    await watchFractionImpl.waitForDeployment();

    // Deploy WatchFractionalizer
    WatchFractionalizer = await ethers.getContractFactory(
      "WatchFractionalizer"
    );
    watchFractionalizer = await WatchFractionalizer.deploy(
      await watchRegistry.getAddress(),
      await watchFractionImpl.getAddress()
    );
    await watchFractionalizer.waitForDeployment();
  });

  describe("Fractionalization", function () {
    it("should allow NFT owner to fractionalize", async function () {
      const tokenId = 1n;
      const totalShares = 1000n;

      // Approve fractionalizer
      await watchRegistry
        .connect(alice)
        .approve(await watchFractionalizer.getAddress(), tokenId);

      // Fractionalize NFT
      await watchFractionalizer
        .connect(alice)
        .fractionalize(tokenId, totalShares);

      // Get fractional token
      const fractionAddress = await watchFractionalizer.getFractionalToken(
        tokenId
      );
      const fraction = await ethers.getContractAt(
        "WatchFraction",
        fractionAddress
      );

      // Assertions
      expect(await fraction.totalSupply()).to.equal(totalShares);
      expect(await fraction.balanceOf(alice.address)).to.equal(totalShares);
    });

    it("should allow NFT redemption by burning all shares", async function () {
      const tokenId = 1n;
      const totalShares = 1000n;

      // Approve and fractionalize
      await watchRegistry
        .connect(alice)
        .approve(await watchFractionalizer.getAddress(), tokenId);
      await watchFractionalizer
        .connect(alice)
        .fractionalize(tokenId, totalShares);

      const fractionAddress = await watchFractionalizer.getFractionalToken(
        tokenId
      );
      const fraction = await ethers.getContractAt(
        "WatchFraction",
        fractionAddress
      );

      // Approve fractionalizer to burn tokens and redeem
      await fraction
        .connect(alice)
        .approve(await watchFractionalizer.getAddress(), totalShares);
      await watchFractionalizer.connect(alice).redeem(tokenId);

      // Assertions
      expect(await watchRegistry.ownerOf(tokenId)).to.equal(alice.address);
      expect(await fraction.totalSupply()).to.equal(0n);
      expect(await fraction.balanceOf(alice.address)).to.equal(0n);
    });
  });
});
