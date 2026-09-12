import { expect } from "chai";
import hre from "hardhat";
const UNLOCK_HASHKEY_LOCK_ABI = [
  "function name() view returns (string)",
  "function keyPrice() view returns (uint256)",
  "function getHasValidKey(address _keyOwner) view returns (bool)",
  "function keyExpirationTimestampFor(address _keyOwner) view returns (uint256)",
  "function purchase(address _recipient) payable returns (uint256)",
  "function grantKey(address _recipient, uint256 _duration)",
  "function expireKey(address user)",
];

const { ethers } = hre as any;

describe("Dual-Service Integration: unlock-hashkey + creator-platform", function () {
  let contentProofRegistry: any;
  let hskPublicLock: any;
  let creator: any;
  let subscriber: any;
  let nonSubscriber: any;
  let lockDeployer: any;

  const keyPrice = ethers.parseEther("10"); // 10 HSK

  beforeEach(async function () {
    [lockDeployer, creator, subscriber, nonSubscriber] = await ethers.getSigners();

    // 1. Service 1 (unlock-hashkey): Deploy PublicLock on HashKey Chain (simulated locally)
    const MockLockFactory = await ethers.getContractFactory("MockPublicLock");
    hskPublicLock = await MockLockFactory.connect(lockDeployer).deploy("DevVault VIP Pass", keyPrice);
    await hskPublicLock.waitForDeployment();

    // 2. Service 2 (creator-platform): Deploy ContentProofRegistry on Avalanche Fuji (simulated locally)
    const ContentRegistryFactory = await ethers.getContractFactory("ContentProofRegistry");
    contentProofRegistry = await ContentRegistryFactory.connect(creator).deploy();
    await contentProofRegistry.waitForDeployment();
  });

  it("should verify unlock-hashkey ABI compatibility", async function () {
    // Verify that the ABI exported in lib/web3/hashkey matches the functions exposed by the lock
    const lockAddress = await hskPublicLock.getAddress();
    const contractWithAbi = new ethers.Contract(lockAddress, UNLOCK_HASHKEY_LOCK_ABI, lockDeployer);

    expect(await contractWithAbi.name()).to.equal("DevVault VIP Pass");
    expect(await contractWithAbi.keyPrice()).to.equal(keyPrice);
  });

  it("should register content proof on Fuji referencing HSK lock address from unlock-hashkey", async function () {
    const lockAddress = await hskPublicLock.getAddress();
    const content = "Secret engineering architecture notes and blueprint";
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));
    const metadataUri = "ipfs://bafybeiblk3s89architecturenotes";

    // Creator anchors content proof on Fuji
    const tx = await contentProofRegistry
      .connect(creator)
      .registerContent(contentHash, metadataUri, lockAddress, true);
    const receipt = await tx.wait();

    // Verify registration event
    const authorContent = await contentProofRegistry.getContentByAuthor(creator.address);
    expect(authorContent.length).to.equal(1);

    const proof = await contentProofRegistry.getProof(authorContent[0]);
    expect(proof.author).to.equal(creator.address);
    expect(proof.contentHash).to.equal(contentHash);
    expect(proof.lockAddress).to.equal(lockAddress);
    expect(proof.isGated).to.be.true;
    expect(receipt.status).to.equal(1);
  });

  it("should enforce membership gate on HSK: non-subscribers denied, subscribers granted", async function () {
    const lockAddress = await hskPublicLock.getAddress();
    const lockContract = new ethers.Contract(lockAddress, UNLOCK_HASHKEY_LOCK_ABI, ethers.provider);

    // Initial check: subscriber does not yet have a valid key on HSK
    const hasKeyInitially = await lockContract.getHasValidKey(subscriber.address);
    expect(hasKeyInitially).to.be.false;

    // Subscriber purchases key on HSK Lock (or receives grant)
    await hskPublicLock.connect(subscriber).purchase(subscriber.address, { value: keyPrice });

    // Key check after purchase on HSK
    const hasKeyAfter = await lockContract.getHasValidKey(subscriber.address);
    expect(hasKeyAfter).to.be.true;

    const expiration = await lockContract.keyExpirationTimestampFor(subscriber.address);
    expect(expiration).to.be.greaterThan(0);

    // Non-subscriber still has no key
    const nonSubscriberKey = await lockContract.getHasValidKey(nonSubscriber.address);
    expect(nonSubscriberKey).to.be.false;
  });

  it("should revoke access when key on HSK expires", async function () {
    // Grant key to subscriber
    await hskPublicLock.connect(subscriber).purchase(subscriber.address, { value: keyPrice });
    expect(await hskPublicLock.getHasValidKey(subscriber.address)).to.be.true;

    // Expire the key on HSK
    await hskPublicLock.expireKey(subscriber.address);

    expect(await hskPublicLock.getHasValidKey(subscriber.address)).to.be.false;
  });

  it("should support updating publication lock address when creator changes tiers in unlock-hashkey", async function () {
    // First lock on HSK
    const lock1Address = await hskPublicLock.getAddress();
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("evolving-post"));

    await contentProofRegistry
      .connect(creator)
      .registerContent(contentHash, "ipfs://v1", lock1Address, true);

    const authorContent = await contentProofRegistry.getContentByAuthor(creator.address);
    const contentId = authorContent[0];

    // Second lock on HSK (e.g. upgraded tier in unlock-hashkey)
    const MockLockFactory = await ethers.getContractFactory("MockPublicLock");
    const hskTier2Lock = await MockLockFactory.connect(lockDeployer).deploy("DevVault Executive Pass", ethers.parseEther("50"));
    await hskTier2Lock.waitForDeployment();
    const lock2Address = await hskTier2Lock.getAddress();

    // Update publication to point to new HSK lock
    await contentProofRegistry
      .connect(creator)
      .updateContent(contentId, "ipfs://v2", lock2Address, true);

    const updatedProof = await contentProofRegistry.getProof(contentId);
    expect(updatedProof.lockAddress).to.equal(lock2Address);
    expect(updatedProof.metadataUri).to.equal("ipfs://v2");
    expect(updatedProof.isGated).to.be.true;
  });
});
