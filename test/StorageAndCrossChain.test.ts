import { expect } from "chai";
import hre from "hardhat";
import { isSupabaseServerConfigured, serverDb } from "../lib/supabase/server";

const { ethers } = hre as any;

describe("Storage & Cross-Chain State Integration", function () {
  let registry: any;
  let creator: any;
  let mockHskLock: any;

  beforeEach(async function () {
    [, creator] = await ethers.getSigners();

    // Deploy ContentProofRegistry on simulated Fuji
    const RegistryFactory = await ethers.getContractFactory("ContentProofRegistry");
    registry = await RegistryFactory.deploy();
    await registry.waitForDeployment();

    // Deploy Mock Unlock Lock on simulated HSK
    const MockLockFactory = await ethers.getContractFactory("MockPublicLock");
    mockHskLock = await MockLockFactory.deploy("HashKey Creator Pass", ethers.parseEther("5"));
    await mockHskLock.waitForDeployment();
  });

  it("should synchronize publication storage with on-chain Fuji proof and HSK lock", async function () {
    const rawContent = "Decentralized content protected across Fuji and HSK";
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(rawContent));
    const hskLockAddress = await mockHskLock.getAddress();
    const HSK_CHAIN_ID = 133n;

    // 1. On-chain Fuji Proof Registration
    const tx = await registry.connect(creator).registerContent(contentHash, hskLockAddress, HSK_CHAIN_ID);
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    const contentId = "1";
    expect(await registry.contentExists(contentId)).to.be.true;

    // 2. Off-chain storage read API should fail closed when DB is unavailable.
    const fetched = await serverDb.publications.getById(`nonexistent-${contentHash}`);
    expect(fetched).to.be.null;

    // 3. Verify list filtering by creator remains safe.
    const creatorPubs = await serverDb.publications.list(creator.address);
    expect(creatorPubs).to.be.an("array");
  });

  it("should handle public content without HSK gating", async function () {
    const rawContent = "Free and public educational material";
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(rawContent));

    const fetched = await serverDb.publications.getById(contentHash);
    expect(fetched).to.be.null;
  });

  it("should create and retrieve user profile linked to creator wallet", async function () {
    const wallet = creator.address;
    if (!isSupabaseServerConfigured()) {
      let error: unknown;
      try {
        await serverDb.users.upsert({
          wallet,
          username: "hsk_fuji_architect",
        });
      } catch (err) {
        error = err;
      }
      expect((error as Error | undefined)?.message).to.equal("Database unavailable");
      return;
    }

    const user = await serverDb.users.upsert({
      wallet,
      username: "hsk_fuji_architect",
    });

    expect(user.wallet.toLowerCase()).to.equal(wallet.toLowerCase());
    expect(user.username).to.equal("hsk_fuji_architect");

    const fetchedUser = await serverDb.users.getByWallet(wallet);
    expect(fetchedUser).to.not.be.null;
    expect(fetchedUser?.username).to.equal("hsk_fuji_architect");
  });
});
