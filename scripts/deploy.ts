import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ContentProofRegistry...");

  const registryFactory = await ethers.getContractFactory("ContentProofRegistry");
  const registry = await registryFactory.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`ContentProofRegistry deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
