const { ethers } = require("hardhat");

const tokens = (n) => ethers.parseUnits(n.toString(), "ether");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);


  const Token = await ethers.getContractFactory("Standard_Token");
  const token = await Token.deploy(
    tokens(1000000),  // initial supply
    "Token",          // name
    18,               // decimals
    "TKN"             // symbol
  );

    await token.waitForDeployment(); 
  console.log("Token deployed to:", await token.getAddress());

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
