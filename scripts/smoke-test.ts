import hre from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";
import { UNLOCK_HASHKEY_LOCK_ABI, HASHKEY_CONFIG } from "../lib/web3/hashkey";
import { CONTENT_PROOF_REGISTRY_ABI } from "../lib/web3/contentProof";
import { AVALANCHE_CONFIG } from "../lib/web3/avalanche";
import { serverDb } from "../lib/supabase/server";

const { ethers } = hre;

interface SmokeCheckResult {
  step: string;
  status: "PASSED" | "FAILED";
  details?: string;
}

const results: SmokeCheckResult[] = [];

function recordPass(step: string, details?: string) {
  results.push({ step, status: "PASSED", details });
  console.log(`  [PASS] ${step}${details ? ` -> ${details}` : ""}`);
}

function recordFail(step: string, error: any) {
  const details = error?.message || String(error);
  results.push({ step, status: "FAILED", details });
  console.error(`  [FAIL] ${step} -> ${details}`);
}

async function runSmokeTests() {
  console.log("====================================================================");
  console.log("        DevVault Creator Platform - Automated Smoke Test Suite      ");
  console.log("====================================================================\n");

  // Step 1: Chain & Environment Configuration Sanity
  console.log("Phase 1: Validating Dual-Chain Configurations...");
  try {
    if (!AVALANCHE_CONFIG.fuji.id || AVALANCHE_CONFIG.fuji.id !== 43113) {
      throw new Error(`Invalid Avalanche Fuji Chain ID: ${AVALANCHE_CONFIG.fuji.id}`);
    }
    if (!HASHKEY_CONFIG.testnet.id || HASHKEY_CONFIG.testnet.id !== 133) {
      throw new Error(`Invalid HashKey Testnet Chain ID: ${HASHKEY_CONFIG.testnet.id}`);
    }
    recordPass(
      "Chain Configurations",
      `Fuji (${AVALANCHE_CONFIG.fuji.id}) | HSK Testnet (${HASHKEY_CONFIG.testnet.id})`
    );
  } catch (err) {
    recordFail("Chain Configurations", err);
  }

  // Step 2: Contract ABIs and Artifacts Sanity
  console.log("\nPhase 2: Validating Contract ABIs & Artifacts...");
  try {
    const requiredFujiFunctions = ["registerContent", "getProof", "getContentByAuthor"];
    for (const fn of requiredFujiFunctions) {
      const exists = CONTENT_PROOF_REGISTRY_ABI.some((item: any) => item.name === fn);
      if (!exists) throw new Error(`Missing expected function in Fuji ABI: ${fn}`);
    }

    const requiredHskFunctions = ["getHasValidKey", "keyExpirationTimestampFor", "purchase"];
    for (const fn of requiredHskFunctions) {
      const exists = UNLOCK_HASHKEY_LOCK_ABI.some((item: any) => item.name === fn);
      if (!exists) throw new Error(`Missing expected function in unlock-hashkey ABI: ${fn}`);
    }
    recordPass("ABI Sanity", "Verified ContentProofRegistry and Unlock-HashKey ABIs");
  } catch (err) {
    recordFail("ABI Sanity", err);
  }

  // Step 3: Cryptographic Proof Generation
  console.log("\nPhase 3: Validating Cryptographic Proof Generation...");
  try {
    const testPayload = "Smoke test content payload for cryptographic integrity";
    const expectedHash = keccak256(toUtf8Bytes(testPayload));
    if (!expectedHash.startsWith("0x") || expectedHash.length !== 66) {
      throw new Error("Invalid keccak256 proof hash format");
    }
    recordPass("Cryptographic Proofs", `Generated valid 256-bit commitment: ${expectedHash.slice(0, 16)}...`);
  } catch (err) {
    recordFail("Cryptographic Proofs", err);
  }

  // Step 4: Resilient In-Memory & Database Layer
  console.log("\nPhase 4: Validating Resilient Data Storage Layer...");
  try {
    const publications = await serverDb.publications.list();
    if (!Array.isArray(publications)) {
      throw new Error("Expected serverDb.publications.list() to return an array");
    }
    const smokePub = await serverDb.publications.create({
      creatorWallet: "0x000000000000000000000000000000000000dEaD",
      title: "Smoke Test Publication",
      preview: "Automated smoke validation record",
      contentHash: keccak256(toUtf8Bytes("smoke-test")),
      version: 1,
    });
    if (!smokePub.id) {
      throw new Error("Publication creation failed to produce an id");
    }
    const retrieved = await serverDb.publications.getById(smokePub.id);
    if (!retrieved || retrieved.id !== smokePub.id) {
      throw new Error("Failed to retrieve created smoke publication by ID");
    }
    recordPass("Data Layer", `Successfully created and verified smoke publication (${smokePub.id.slice(0, 10)}...)`);
  } catch (err) {
    recordFail("Data Layer", err);
  }

  // Step 5: Dual-Chain Workflow Execution (Mock Fuji + Mock HSK)
  console.log("\nPhase 5: Validating End-to-End Dual-Chain Workflow...");
  try {
    const [deployer, creator, subscriber] = await ethers.getSigners();

    // 1. Service 1 (unlock-hashkey): Deploy Lock on HSK
    const MockLockFactory = await ethers.getContractFactory("MockPublicLock");
    const hskLock = await MockLockFactory.connect(deployer).deploy(
      "Smoke Pass",
      ethers.parseEther("1")
    );
    await hskLock.waitForDeployment();
    const hskLockAddress = await hskLock.getAddress();

    // 2. Service 2 (creator-platform): Deploy Registry on Fuji
    const RegistryFactory = await ethers.getContractFactory("ContentProofRegistry");
    const registry = await RegistryFactory.connect(creator).deploy();
    await registry.waitForDeployment();

    // 3. Register Content Proof on Fuji referencing HSK Lock
    const content = "Confidential Smoke Test Research Document";
    const contentHash = keccak256(toUtf8Bytes(content));
    const tx = await registry
      .connect(creator)
      .registerContent(contentHash, "ipfs://QmSmokeTest", hskLockAddress, true);
    await tx.wait();

    // 4. Test Gating Check Before Key
    const initialKey = await hskLock.getHasValidKey(subscriber.address);
    if (initialKey !== false) {
      throw new Error("Subscriber should not have access before key grant/purchase");
    }

    // 5. Test Key Grant & Access on HSK
    await hskLock.grantKey(subscriber.address, 3600);
    const keyAfter = await hskLock.getHasValidKey(subscriber.address);
    if (keyAfter !== true) {
      throw new Error("Subscriber must have access after key grant on HSK");
    }

    recordPass(
      "Dual-Chain Workflow",
      `Fuji Proof (Registry @ ${await registry.getAddress()}) + HSK Membership (Lock @ ${hskLockAddress})`
    );
  } catch (err) {
    recordFail("Dual-Chain Workflow", err);
  }

  // Summary
  console.log("\n====================================================================");
  console.log("                        Smoke Test Summary                          ");
  console.log("====================================================================");

  const passedCount = results.filter((r) => r.status === "PASSED").length;
  const failedCount = results.filter((r) => r.status === "FAILED").length;

  console.log(`Total Checks: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}\n`);

  if (failedCount > 0) {
    console.error("SMOKE TEST FAILED! One or more critical systems are unfunctional.");
    process.exit(1);
  } else {
    console.log("ALL SMOKE CHECKS PASSED! The platform is healthy and ready.");
    process.exit(0);
  }
}

runSmokeTests().catch((err) => {
  console.error("Fatal error during smoke tests:", err);
  process.exit(1);
});
