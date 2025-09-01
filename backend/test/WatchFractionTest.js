const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 18); // 18 decimals like ERC20
};

describe("WatchFraction", () => {
  let fraction, accounts, deployer, alice, bob, fractionalizer;
  const TOTAL_SUPPLY = tokens(1000);

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    alice = accounts[1];
    bob = accounts[2];
    fractionalizer = deployer; // use deployer as fractionalizer for tests

    const WatchFraction = await ethers.getContractFactory("WatchFraction");
    fraction = await WatchFraction.deploy();
    await fraction.waitForDeployment();

    await fraction.initialize(
      "Watch 1",
      "W1",
      TOTAL_SUPPLY,
      deployer.address,
      fractionalizer.address
    );
  });

  //
  // Deployment
  //
  describe("Deployment", () => {
    it("has correct name", async () => {
      expect(await fraction.name()).to.equal("Watch 1");
    });

    it("has correct symbol", async () => {
      expect(await fraction.symbol()).to.equal("W1");
    });

    it("has 18 decimals", async () => {
      expect(await fraction.decimals()).to.equal(18);
    });

    it("has correct total supply", async () => {
      expect(await fraction.totalSupply()).to.equal(TOTAL_SUPPLY);
    });

    it("assigns total supply to deployer", async () => {
      expect(await fraction.balanceOf(deployer.address)).to.equal(TOTAL_SUPPLY);
    });

    it("stores fractionalizer address", async () => {
      expect(await fraction.fractionalizer()).to.equal(fractionalizer.address);
    });
  });

  //
  // Transfers
  //
  describe("Sending Tokens", () => {
    let amount, transaction;

    describe("Success", () => {
      beforeEach(async () => {
        amount = tokens(100);
        transaction = await fraction
          .connect(deployer)
          .transfer(alice.address, amount);
        await transaction.wait();
      });

      it("transfers balances", async () => {
        expect(await fraction.balanceOf(deployer.address)).to.equal(
          tokens(900)
        );
        expect(await fraction.balanceOf(alice.address)).to.equal(amount);
      });

      it("emits Transfer event", async () => {
        await expect(transaction)
          .to.emit(fraction, "Transfer")
          .withArgs(deployer.address, alice.address, amount);
      });
    });

    describe("Failure", () => {
      it("rejects insufficient balances", async () => {
        const invalidAmount = tokens(10000); // more than total supply
        await expect(
          fraction.connect(alice).transfer(bob.address, invalidAmount)
        ).to.be.reverted;
      });

      it("rejects invalid recipient", async () => {
        const amount = tokens(100);
        await expect(
          fraction
            .connect(deployer)
            .transfer("0x0000000000000000000000000000000000000000", amount)
        ).to.be.reverted;
      });
    });
  });

  //
  // Approvals
  //
  describe("Approving Tokens", () => {
    let amount, transaction;

    beforeEach(async () => {
      amount = tokens(100);
      transaction = await fraction
        .connect(deployer)
        .approve(alice.address, amount);
      await transaction.wait();
    });

    it("allocates allowance for delegated transfer", async () => {
      expect(
        await fraction.allowance(deployer.address, alice.address)
      ).to.equal(amount);
    });

    it("emits Approval event", async () => {
      await expect(transaction)
        .to.emit(fraction, "Approval")
        .withArgs(deployer.address, alice.address, amount);
    });

    it("rejects invalid spender", async () => {
      await expect(
        fraction
          .connect(deployer)
          .approve("0x0000000000000000000000000000000000000000", amount)
      ).to.be.reverted;
    });
  });

  //
  // Delegated Transfers
  //
  describe("Delegated Transfers", () => {
    let amount;

    beforeEach(async () => {
      amount = tokens(100);
      await fraction.connect(deployer).approve(alice.address, amount);
    });

    it("transfers balances via transferFrom", async () => {
      await fraction
        .connect(alice)
        .transferFrom(deployer.address, bob.address, amount);
      expect(await fraction.balanceOf(deployer.address)).to.equal(tokens(900));
      expect(await fraction.balanceOf(bob.address)).to.equal(amount);
    });

    it("resets allowance", async () => {
      await fraction
        .connect(alice)
        .transferFrom(deployer.address, bob.address, amount);
      expect(
        await fraction.allowance(deployer.address, alice.address)
      ).to.equal(0);
    });

    it("rejects transfers larger than allowance", async () => {
      await expect(
        fraction
          .connect(alice)
          .transferFrom(deployer.address, bob.address, tokens(1000))
      ).to.be.reverted;
    });
  });

  //
  // Burning (Fractionalizer-specific)
  //
  describe("Burning Fractions", () => {
    it("allows fractionalizer to burn from user", async () => {
      await fraction
        .connect(fractionalizer)
        .burnFromUser(deployer.address, tokens(200));
      expect(await fraction.balanceOf(deployer.address)).to.equal(tokens(800));
      expect(await fraction.totalSupply()).to.equal(tokens(800));
    });

    it("rejects burn by non-fractionalizer", async () => {
      await expect(
        fraction.connect(alice).burnFromUser(deployer.address, tokens(100))
      ).to.be.revertedWith("Not fractionalizer");
    });
  });
});
