import hre from "hardhat";

const { ethers } = hre;

const EXPECTED_CHAIN_IDS: Record<string, bigint | undefined> = {
  hardhat: 31337n,
  avalancheFuji: 43113n,
};

async function main() {
  console.log(`Hardhat network: ${hre.network.name}`);
  const expectedChainId = Object.prototype.hasOwnProperty.call(EXPECTED_CHAIN_IDS, hre.network.name)
    ? EXPECTED_CHAIN_IDS[hre.network.name]
    : undefined;
  if (expectedChainId === undefined) {
    throw new Error("Unsupported network. Only hardhat and avalancheFuji are allowed.");
  }

  const { chainId } = await ethers.provider.getNetwork();
  console.log(`Connected chain ID: ${chainId}`);
  if (chainId !== expectedChainId) {
    throw new Error(`Chain ID mismatch: expected ${expectedChainId}, received ${chainId}.`);
  }

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No usable deployer signer configured for the selected network.");
  }
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`Deployer address: ${deployerAddress}`);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} native tokens (${balance} wei)`);
  if (balance === 0n) {
    throw new Error("Deployer balance is zero; deployment requires native tokens for gas.");
  }

  const registryFactory = await ethers.getContractFactory("ContentProofRegistry", deployer);
  const registry = await registryFactory.deploy();
  const transaction = registry.deploymentTransaction();
  if (!transaction) {
    throw new Error("Deployment transaction is unavailable.");
  }
  console.log(`Deployment transaction hash: ${transaction.hash}`);
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`ContentProofRegistry deployed to: ${address}`);
  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Deployment did not produce a successful transaction receipt.");
  }
  console.log(`Deployment block number: ${receipt.blockNumber}`);
}

main().catch((error) => {
  // Do not dump provider errors: they can include credential-bearing RPC URLs.
  const safeMessages = [
    "Unsupported network.", "Chain ID mismatch:", "No usable deployer signer",
    "Deployer balance is zero;", "Deployment transaction is unavailable.",
    "Deployment did not produce a successful transaction receipt.",
  ];
  const message = error instanceof Error ? error.message : "";
  console.error(safeMessages.some((prefix) => message.startsWith(prefix))
    ? message
    : "Deployment failed. Check RPC connectivity, signer configuration, and funds for gas.");
  process.exitCode = 1;
});
