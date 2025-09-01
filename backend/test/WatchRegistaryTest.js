const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WatchRegistry", function () {
  let WatchRegistry, watchRegistry, owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    WatchRegistry = await ethers.getContractFactory("WatchRegistry");
    watchRegistry = await WatchRegistry.deploy(); // v6: no .deployed()
  });

  describe("Deployment", function () {
    it("should deploy with correct name and symbol", async function () {
      expect(await watchRegistry.name()).to.equal("Luxury Watch Registry");
      expect(await watchRegistry.symbol()).to.equal("WATCH");
    });
  });

  describe("Minting Watches", function () {
    it("should allow owner to mint a watch", async function () {
      const uri = "ipfs://QmTestHash/rolex.json";

      await watchRegistry.connect(owner).mintWatch(alice.address, uri);

      expect(await watchRegistry.ownerOf(1n)).to.equal(alice.address); // note 1n for BigInt
      expect(await watchRegistry.tokenURI(1n)).to.equal(uri);
    });

    it("should NOT allow non-owner to mint", async function () {
      const uri = "ipfs://QmFake/omega.json";

      await expect(watchRegistry.connect(alice).mintWatch(alice.address, uri))
        .to.be.reverted;
    });

    it("should increment tokenIdCounter for each mint", async function () {
      await watchRegistry
        .connect(owner)
        .mintWatch(alice.address, "ipfs://rolex.json");
      await watchRegistry
        .connect(owner)
        .mintWatch(bob.address, "ipfs://omega.json");

      expect(await watchRegistry.ownerOf(1n)).to.equal(alice.address);
      expect(await watchRegistry.ownerOf(2n)).to.equal(bob.address);
    });
  });

  describe("Token URI", function () {
    it("should revert when querying URI for nonexistent token", async function () {
      await expect(watchRegistry.tokenURI(999n)).to.be.revertedWith(
        "WatchRegistry: URI query for nonexistent token"
      );
    });
  });
});
