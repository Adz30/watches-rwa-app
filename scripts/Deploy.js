const { ethers } = require("hardhat");

const tokens = (n) => ethers.utils.parseUnits(n.toString(), "ether");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy("Token", "Tkn", tokens(1000000));
  console.log("Token A deployed to:", token.address);

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
