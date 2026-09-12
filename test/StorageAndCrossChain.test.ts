import { expect } from "chai";
import hre from "hardhat";
import { serverDb } from "../lib/supabase/server";

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
    const metadataUri = "ipfs://QmStorageIntegrationTest";

    // 1. On-chain Fuji Proof Registration
    const tx = await registry.connect(creator).registerContent(contentHash, metadataUri, hskLockAddress, true);
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    const authorContent = await registry.getContentByAuthor(creator.address);
    const contentId = authorContent[0];

    // 2. Off-chain Storage Creation (Supabase / In-Memory resilient fallback)
    const pub = await serverDb.publications.create({
      id: contentId,
      creatorWallet: creator.address,
      title: "Cross-Chain Architecture Guide",
      description: "How HashKey memberships gate Fuji proofs",
      preview: "Preview of the architectural breakdown...",
      premiumContent: rawContent,
      contentHash,
      lockAddress: hskLockAddress,
      proofId: contentId,
      avalancheTx: receipt.hash,
      version: 1,
    });

    expect(pub.id).to.equal(contentId);
    expect(pub.isGated).to.be.true;
    expect(pub.lockAddress).to.equal(hskLockAddress);
    expect(pub.contentHash).to.equal(contentHash);

    // 3. Verify retrieval by ID
    const fetched = await serverDb.publications.getById(contentId);
    expect(fetched).to.not.be.null;
    expect(fetched?.title).to.equal("Cross-Chain Architecture Guide");
    expect(fetched?.isGated).to.be.true;

    // 4. Verify list filtering by creator
    const creatorPubs = await serverDb.publications.list(creator.address);
    expect(creatorPubs.some((p) => p.id === contentId)).to.be.true;
  });

  it("should handle public content without HSK gating", async function () {
    const rawContent = "Free and public educational material";
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(rawContent));

    const pub = await serverDb.publications.create({
      creatorWallet: creator.address,
      title: "Public Web3 Foundations",
      preview: "Free preview for all users",
      contentHash,
      version: 1,
    });

    expect(pub.isGated).to.be.false;
    expect(pub.lockAddress).to.be.undefined;
  });

  it("should create and retrieve user profile linked to creator wallet", async function () {
    const wallet = creator.address;
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
