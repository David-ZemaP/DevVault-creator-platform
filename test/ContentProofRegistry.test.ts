import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre as any;

describe("ContentProofRegistry", function () {
  let registry: any;
  let owner: any;
  let creator: any;
  let creator2: any;
  let otherAccount: any;

  beforeEach(async function () {
    [owner, creator, creator2, otherAccount] = await ethers.getSigners();
    const ContentProofRegistryFactory = await ethers.getContractFactory("ContentProofRegistry");
    registry = await ContentProofRegistryFactory.deploy();
    await registry.waitForDeployment();
  });

  describe("Registration", function () {
    it("should register content proof successfully", async function () {
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("example-content-proof"));
      const metadataUri = "ipfs://QmExampleContentMetadataUri";
      const lockAddress = ethers.ZeroAddress;

      const tx = await registry.connect(creator).registerContent(contentHash, metadataUri, lockAddress, false);
      await tx.wait();

      const authorContent = await registry.getContentByAuthor(creator.address);
      expect(authorContent.length).to.equal(1);

      const proof = await registry.getProof(authorContent[0]);
      expect(proof.author).to.equal(creator.address);
      expect(proof.contentHash).to.equal(contentHash);
      expect(proof.metadataUri).to.equal(metadataUri);
      expect(proof.isGated).to.be.false;
      expect(proof.lockAddress).to.equal(lockAddress);
      expect(proof.createdAt).to.be.greaterThan(0);
    });

    it("should emit ContentRegistered event with indexed parameters", async function () {
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("event-test-proof"));
      const metadataUri = "ipfs://QmEventUri";
      const lockAddress = "0x1111111111111111111111111111111111111111";

      const tx = await registry.connect(creator).registerContent(contentHash, metadataUri, lockAddress, true);
      await expect(tx)
        .to.emit(registry, "ContentRegistered")
        .withArgs(
          (contentId: string) => typeof contentId === "string" && contentId.startsWith("0x"),
          contentHash,
          creator.address,
          lockAddress,
          metadataUri,
          (timestamp: any) => timestamp > 0
        );
    });

    it("should revert if registering zero hash", async function () {
      await expect(
        registry.connect(creator).registerContent(ethers.ZeroHash, "uri", ethers.ZeroAddress, false)
      ).to.be.revertedWithCustomError(registry, "InvalidHash");
    });

    it("should isolate content between different creators", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("creator1-doc-1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("creator1-doc-2"));
      const hash3 = ethers.keccak256(ethers.toUtf8Bytes("creator2-doc-1"));

      await registry.connect(creator).registerContent(hash1, "ipfs://c1-1", ethers.ZeroAddress, false);
      await registry.connect(creator).registerContent(hash2, "ipfs://c1-2", ethers.ZeroAddress, false);
      await registry.connect(creator2).registerContent(hash3, "ipfs://c2-1", ethers.ZeroAddress, false);

      const creator1List = await registry.getContentByAuthor(creator.address);
      const creator2List = await registry.getContentByAuthor(creator2.address);

      expect(creator1List.length).to.equal(2);
      expect(creator2List.length).to.equal(1);
      expect(creator1List).to.not.include(creator2List[0]);
    });

    it("should accurately track totalContent and getAllContentIds", async function () {
      expect(await registry.totalContent()).to.equal(0);

      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("item-1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("item-2"));

      await registry.connect(creator).registerContent(hash1, "uri-1", ethers.ZeroAddress, false);
      await registry.connect(creator).registerContent(hash2, "uri-2", ethers.ZeroAddress, false);

      expect(await registry.totalContent()).to.equal(2);
      const allIds = await registry.getAllContentIds();
      expect(allIds.length).to.equal(2);
    });
  });

  describe("Updates and Security", function () {
    let contentId: string;
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("updatable-content-proof"));

    beforeEach(async function () {
      const tx = await registry.connect(creator).registerContent(contentHash, "ipfs://v1", ethers.ZeroAddress, false);
      await tx.wait();
      const authorContent = await registry.getContentByAuthor(creator.address);
      contentId = authorContent[0];
    });

    it("should allow author to update content metadata and lockAddress", async function () {
      const hskLockAddress = "0x2222222222222222222222222222222222222222";
      const updateTx = await registry.connect(creator).updateContent(contentId, "ipfs://v2", hskLockAddress, true);

      await expect(updateTx)
        .to.emit(registry, "ContentUpdated")
        .withArgs(contentId, "ipfs://v2", hskLockAddress, true);

      const updatedProof = await registry.getProof(contentId);
      expect(updatedProof.metadataUri).to.equal("ipfs://v2");
      expect(updatedProof.isGated).to.be.true;
      expect(updatedProof.lockAddress).to.equal(hskLockAddress);
      // Original immutable fields must not change
      expect(updatedProof.contentHash).to.equal(contentHash);
      expect(updatedProof.author).to.equal(creator.address);
    });

    it("should prevent unauthorized updates from third parties", async function () {
      await expect(
        registry.connect(otherAccount).updateContent(contentId, "ipfs://v3", otherAccount.address, true)
      ).to.be.revertedWithCustomError(registry, "Unauthorized");
    });

    it("should allow contract owner to update content as administrative override", async function () {
      const adminTx = await registry.connect(owner).updateContent(contentId, "ipfs://admin-v1", ethers.ZeroAddress, false);
      await adminTx.wait();

      const proof = await registry.getProof(contentId);
      expect(proof.metadataUri).to.equal("ipfs://admin-v1");
    });

    it("should revert with ContentNotFound for non-existent contentId", async function () {
      const nonExistentId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));

      await expect(registry.getProof(nonExistentId)).to.be.revertedWithCustomError(
        registry,
        "ContentNotFound"
      );

      await expect(
        registry.connect(creator).updateContent(nonExistentId, "ipfs://v2", ethers.ZeroAddress, false)
      ).to.be.revertedWithCustomError(registry, "ContentNotFound");
    });
  });
});
