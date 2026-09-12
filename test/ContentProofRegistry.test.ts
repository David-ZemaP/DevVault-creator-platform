import { expect } from "chai";
import { ethers } from "hardhat";

describe("ContentProofRegistry", function () {
  let registry: any;
  let owner: any;
  let creator: any;
  let otherAccount: any;

  beforeEach(async function () {
    [owner, creator, otherAccount] = await ethers.getSigners();
    const ContentProofRegistryFactory = await ethers.getContractFactory("ContentProofRegistry");
    registry = await ContentProofRegistryFactory.deploy();
    await registry.waitForDeployment();
  });

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
  });

  it("should revert if registering zero hash", async function () {
    await expect(
      registry.connect(creator).registerContent(ethers.ZeroHash, "uri", ethers.ZeroAddress, false)
    ).to.be.revertedWithCustomError(registry, "InvalidHash");
  });

  it("should allow author to update content", async function () {
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("updateable-content"));
    const tx = await registry.connect(creator).registerContent(contentHash, "ipfs://v1", ethers.ZeroAddress, false);
    await tx.wait();

    const authorContent = await registry.getContentByAuthor(creator.address);
    const contentId = authorContent[0];

    await registry.connect(creator).updateContent(contentId, "ipfs://v2", creator.address, true);

    const updatedProof = await registry.getProof(contentId);
    expect(updatedProof.metadataUri).to.equal("ipfs://v2");
    expect(updatedProof.isGated).to.be.true;
    expect(updatedProof.lockAddress).to.equal(creator.address);
  });

  it("should prevent unauthorized updates", async function () {
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("protected-content"));
    const tx = await registry.connect(creator).registerContent(contentHash, "ipfs://v1", ethers.ZeroAddress, false);
    await tx.wait();

    const authorContent = await registry.getContentByAuthor(creator.address);
    const contentId = authorContent[0];

    await expect(
      registry.connect(otherAccount).updateContent(contentId, "ipfs://v2", otherAccount.address, true)
    ).to.be.revertedWithCustomError(registry, "Unauthorized");
  });
});
