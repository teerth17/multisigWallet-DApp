// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [owner1, owner2, owner3] = await hre.ethers.getSigners();
  // console.log(owner1.address + owner2.address + owner3.address)
  const sepolia_owners = [
    "0xbfC9D3c08bA959B1622c918a567366445527d401",
    "0xf847EF00fb884f1d24Ef82c6594557490c998F89",
    "0x090aaaCdC02094f88Dbee5aAf0929946C25e35E5",
  ];
  const quorumRequired = 2;

  // const MultiSigWallet = await hre.ethers.getContractFactory("MultisigWallet");
  // const multisigWallet = await MultiSigWallet.deploy(
  //   [owner1.address, owner2.address, owner3.address],
  //   quorumRequired
  // );
  let args1;
  if (hre.network.name === "sepolia") {
    args1 = sepolia_owners;
  } else {
    args1 = [owner1.address, owner2.address, owner3.address];
  }
  const multisigWallet = await hre.ethers.deployContract("MultisigWallet", [
    args1,
    quorumRequired,
  ]);

  await multisigWallet.waitForDeployment();

  console.log(`Deployed Multisig Contract to ${multisigWallet.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
