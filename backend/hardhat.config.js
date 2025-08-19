require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      chainId: 1337
    }
  },
  solidity: {
    version: "0.8.23",      // match your contracts
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
