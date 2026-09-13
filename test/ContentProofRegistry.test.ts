import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("ContentProofRegistry", function () {
  // Dummy local fixtures only; these are NOT actual Unlock deployments.
  const lock = "0x1111111111111111111111111111111111111111";
  const secondLock = "0x2222222222222222222222222222222222222222";
  const chainId = 133n;
  const hash = ethers.id("publication-version-1");
  const secondHash = ethers.id("publication-version-2");

  async function deployFixture() {
    const [deployer, creator, other] = await ethers.getSigners();
    const registry: any = await ethers.deployContract("ContentProofRegistry");
    await registry.waitForDeployment();
    return { registry, deployer, creator, other };
  }

  async function registeredFixture() {
    const fixture = await deployFixture();
    await fixture.registry.connect(fixture.creator).registerContent(hash, lock, chainId);
    return fixture;
  }

  it("registers ID 1 with the caller as creator and the full initial proof and event", async function () {
    const { registry, creator } = await deployFixture();
    expect(await registry.contentExists(0)).to.equal(false);
    expect(await registry.contentExists(1)).to.equal(false);
    expect(await registry.connect(creator).registerContent.staticCall(hash, lock, chainId)).to.equal(1n);
    const timestamp = (await ethers.provider.getBlock("latest"))!.timestamp + 10;
    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await expect(registry.connect(creator).registerContent(hash, lock, chainId))
      .to.emit(registry, "ContentRegistered")
      .withArgs(1n, creator.address, lock, hash, chainId, 1n, timestamp);
    expect(await registry.contentExists(1)).to.equal(true);
    expect(await registry.getContentMetadata(1)).to.deep.equal([creator.address, 1n, BigInt(timestamp)]);
    expect(await registry.getProof(1, 1)).to.deep.equal([hash, lock, chainId, 1n, BigInt(timestamp)]);
    expect(await registry.getLatestProof(1)).to.deep.equal(await registry.getProof(1, 1));
  });

  it("appends versions, preserves historical proofs and creation metadata, and emits routing data", async function () {
    const { registry, creator } = await registeredFixture();
    const original = await registry.getProof(1, 1);
    const metadata = await registry.getContentMetadata(1);
    expect(await registry.connect(creator).registerVersion.staticCall(1, secondHash, secondLock, 43113))
      .to.equal(2n);
    const timestamp = (await ethers.provider.getBlock("latest"))!.timestamp + 10;
    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await expect(registry.connect(creator).registerVersion(1, secondHash, secondLock, 43113))
      .to.emit(registry, "VersionRegistered")
      .withArgs(1n, creator.address, secondLock, secondHash, 43113n, 2n, timestamp);
    const second = await registry.getProof(1, 2);
    expect(second).to.deep.equal([secondHash, secondLock, 43113n, 2n, BigInt(timestamp)]);
    expect(await registry.getLatestProof(1)).to.deep.equal(second);
    expect(await registry.getProof(1, 1)).to.deep.equal(original);
    expect(await registry.getContentMetadata(1)).to.deep.equal([creator.address, 2n, metadata.createdAt]);
    await registry.connect(creator).registerVersion(1, ethers.id("version-3"), lock, chainId);
    expect((await registry.getLatestProof(1)).version).to.equal(3n);
    expect(await registry.getProof(1, 1)).to.deep.equal(original);
    expect(await registry.getProof(1, 2)).to.deep.equal(second);
  });

  it("allocates independent sequential IDs even for duplicate hashes", async function () {
    const { registry, creator, other } = await registeredFixture();
    await registry.connect(creator).registerContent(hash, lock, chainId);
    await registry.connect(other).registerContent(hash, lock, chainId);
    await registry.connect(creator).registerVersion(1, secondHash, lock, chainId);
    expect((await registry.getContentMetadata(2)).creator).to.equal(creator.address);
    expect((await registry.getContentMetadata(3)).creator).to.equal(other.address);
    expect((await registry.getLatestProof(2)).version).to.equal(1n);
    expect((await registry.getLatestProof(3)).version).to.equal(1n);
    expect(await registry.contentExists(4)).to.equal(false);
  });

  for (const role of ["other", "deployer"] as const) {
    it(`rejects updates by ${role}, with no deployer privilege`, async function () {
      const fixture = await registeredFixture();
      const { registry } = fixture;
      const before = await registry.getLatestProof(1);
      await expect(registry.connect(fixture[role]).registerVersion(1, secondHash, lock, chainId))
        .to.be.revertedWithCustomError(registry, "NotContentCreator").withArgs(1n, fixture[role].address);
      expect(await registry.getLatestProof(1)).to.deep.equal(before);
      expect((await registry.getContentMetadata(1)).latestVersion).to.equal(1n);
    });
  }

  const invalidCases = [
    { hash: ethers.ZeroHash, lock, chain: chainId, error: "InvalidContentHash" },
    { hash, lock: ethers.ZeroAddress, chain: chainId, error: "InvalidMembershipLock" },
    { hash, lock, chain: 0n, error: "InvalidMembershipChainId" },
  ];
  for (const invalid of invalidCases) {
    it(`rejects ${invalid.error} on registration without consuming an ID`, async function () {
      const { registry, creator } = await deployFixture();
      await expect(registry.connect(creator).registerContent(invalid.hash, invalid.lock, invalid.chain))
        .to.be.revertedWithCustomError(registry, invalid.error);
      expect(await registry.contentExists(1)).to.equal(false);
      await registry.connect(creator).registerContent(hash, lock, chainId);
      expect(await registry.contentExists(1)).to.equal(true);
      expect(await registry.contentExists(2)).to.equal(false);
    });

    it(`rejects ${invalid.error} on version append without changing history`, async function () {
      const { registry, creator } = await registeredFixture();
      const before = await registry.getLatestProof(1);
      await expect(registry.connect(creator).registerVersion(1, invalid.hash, invalid.lock, invalid.chain))
        .to.be.revertedWithCustomError(registry, invalid.error);
      expect(await registry.getLatestProof(1)).to.deep.equal(before);
      expect((await registry.getContentMetadata(1)).latestVersion).to.equal(1n);
      await registry.connect(creator).registerVersion(1, secondHash, lock, chainId);
      expect((await registry.getLatestProof(1)).version).to.equal(2n);
    });
  }

  for (const id of [0n, 2n, ethers.MaxUint256]) {
    it(`rejects nonexistent content ${id} in every reader and version registration`, async function () {
      const { registry, creator } = await registeredFixture();
      expect(await registry.contentExists(id)).to.equal(false);
      for (const query of [() => registry.getContentMetadata(id), () => registry.getProof(id, 1), () => registry.getLatestProof(id)]) {
        await expect(query()).to.be.revertedWithCustomError(registry, "ContentNotFound").withArgs(id);
      }
      await expect(registry.connect(creator).registerVersion(id, secondHash, lock, chainId))
        .to.be.revertedWithCustomError(registry, "ContentNotFound").withArgs(id);
    });
  }

  for (const version of [0n, 2n, ethers.MaxUint256]) {
    it(`rejects nonexistent version ${version}`, async function () {
      const { registry } = await registeredFixture();
      await expect(registry.getProof(1, version))
        .to.be.revertedWithCustomError(registry, "VersionNotFound").withArgs(1n, version);
    });
  }
});
