import { expect } from "chai";
import { Interface, JsonRpcProvider, ZeroAddress } from "ethers";
import { INITIALIZER_ABI, PUBLIC_LOCK_ABI, PURCHASE_SIGNATURE, UNLOCK_ABI } from "../lib/web3/abis";
import { UNLOCK_ADDRESS, TEST_CREATOR_LOCK } from "../lib/web3/hsk";
import {
  connectHskWallet,
  encodeMembershipInitializer,
  extractNewLock,
  nativePurchaseArgs,
  hasMembership,
  getMembershipInfo,
} from "../lib/web3/membership";
import { createMembershipGuard } from "../lib/server/membership-guard";

const buyer = "0x109697F9b1C8FC31461c4eA42F7F12e99301fCbe";

describe("Unlock HashKey Integration Unit Suite", function () {
  it("initializer preserves native currency, wei, creator, and duration", function () {
    const data = encodeMembershipInitializer({
      creatorAddress: buyer,
      name: "Membership",
      durationSeconds: 2592000n,
      priceWei: 100000000000000n,
      maxMembers: 100n,
    });
    const decoded = new Interface(INITIALIZER_ABI).decodeFunctionData("initialize", data);
    expect([...decoded]).to.deep.equal([buyer, 2592000n, ZeroAddress, 100000000000000n, 100n, "Membership"]);
    expect(() =>
      encodeMembershipInitializer({
        creatorAddress: buyer,
        name: "x",
        durationSeconds: 0n,
        priceWei: 1n,
        maxMembers: 100n,
      })
    ).to.throw();
  });

  it("tuple ABI encodes exactly one native membership period", function () {
    const iface = new Interface(PUBLIC_LOCK_ABI);
    const data = iface.encodeFunctionData(PURCHASE_SIGNATURE, [nativePurchaseArgs(buyer)]);
    const [args] = iface.decodeFunctionData(PURCHASE_SIGNATURE, data);
    expect(args.length).to.equal(1);
    expect([...args[0]]).to.deep.equal([0n, buyer, ZeroAddress, ZeroAddress, ZeroAddress, "0x", 0n]);
  });

  it("NewLock extraction accepts only factory events with the expected creator", function () {
    const iface = new Interface(UNLOCK_ABI);
    const event = iface.encodeEventLog(iface.getEvent("NewLock")!, [buyer, TEST_CREATOR_LOCK]);
    const spoofed = { ...event, address: TEST_CREATOR_LOCK };
    expect(() => extractNewLock([spoofed], buyer)).to.throw();
    expect(extractNewLock([spoofed, { ...event, address: UNLOCK_ADDRESS }], buyer)).to.equal(TEST_CREATOR_LOCK);
    expect(() => extractNewLock([{ ...event, address: UNLOCK_ADDRESS }], ZeroAddress)).to.throw();
  });

  it("wallet adds unknown HSK network, switches, and requests accounts", async function () {
    let chain = "0x1",
      added = false;
    const methods: string[] = [];
    const wallet = {
      async request({ method, params }: { method: string; params?: any[] }) {
        methods.push(method);
        if (method === "eth_chainId") return chain;
        if (method === "wallet_addEthereumChain") {
          expect(params![0].chainId).to.equal("0x85");
          added = true;
          return null;
        }
        if (method === "wallet_switchEthereumChain") {
          if (!added) throw { code: 4902 };
          chain = "0x85";
          return null;
        }
        if (method === "eth_requestAccounts") return [buyer];
        throw new Error(`Unexpected wallet call: ${method}`);
      },
    };
    const provider = await connectHskWallet(wallet as any);
    expect(chain).to.equal("0x85");
    expect(methods.filter((m) => m === "wallet_switchEthereumChain").length).to.equal(2);
    provider.destroy();
  });

  it("wallet cancellation is propagated without adding a network", async function () {
    let rejected = false;
    try {
      await connectHskWallet({
        async request({ method }: { method: string }) {
          if (method === "eth_chainId") return "0x1";
          if (method === "wallet_switchEthereumChain") throw new Error("User rejected");
          throw new Error("Must not add chain");
        },
      } as any);
    } catch (err: any) {
      rejected = /User rejected/.test(err.message);
    }
    expect(rejected).to.be.true;
  });

  class ReadOnlyProvider extends JsonRpcProvider {
    calls: any[] = [];
    chain = "0x85";
    constructor() {
      super("http://unused.invalid", 133, { cacheTimeout: -1 });
    }
    async _send(payload: any) {
      const iface = new Interface(PUBLIC_LOCK_ABI);
      const items = Array.isArray(payload) ? payload : [payload];
      return items.map((p) => {
        this.calls.push(p);
        let result: any;
        if (p.method === "eth_chainId") result = this.chain;
        else if (p.method === "eth_call") {
          expect(p.params[0].to.toLowerCase()).to.equal(TEST_CREATOR_LOCK.toLowerCase());
          const f = iface.parseTransaction({ data: p.params[0].data })!;
          const values: Record<string, any> = {
            getHasValidKey: true,
            name: "Membership",
            keyPrice: 100000000000000n,
            expirationDuration: 2592000n,
            totalSupply: 1n,
            balanceOf: 1n,
            publicLockVersion: 15n,
          };
          result = iface.encodeFunctionResult(f.fragment, [values[f.name]]);
        } else throw new Error(`Forbidden RPC in read-only helper: ${p.method}`);
        return { id: p.id, jsonrpc: "2.0", result };
      });
    }
  }

  it("membership reads use the supplied confirmed block and never send transactions", async function () {
    const provider = new ReadOnlyProvider();
    try {
      const input = { lockAddress: TEST_CREATOR_LOCK, userAddress: buyer };
      expect(await hasMembership(input, { provider, blockNumber: 123 })).to.be.true;
      const info = await getMembershipInfo(input, { provider, blockNumber: 123 });
      expect(info.version).to.equal(15n);
      expect(info.hasMembership).to.be.true;
      expect(info.keyPrice).to.equal(100000000000000n);
      expect(provider.calls.filter((p) => p.method === "eth_call").every((p) => p.params[1] === "0x7b")).to.be.true;
    } finally {
      provider.destroy();
    }
  });

  it("wrong chain fails closed", async function () {
    const provider = new ReadOnlyProvider();
    provider.chain = "0x1";
    let failed = false;
    try {
      await hasMembership({ lockAddress: TEST_CREATOR_LOCK, userAddress: buyer }, { provider });
    } catch {
      failed = true;
    }
    expect(failed).to.be.true;
    expect(provider.calls.filter((p) => p.method === "eth_call").length).to.equal(0);
    provider.destroy();
  });

  it("server loads premium content only after successful membership verification", async function () {
    for (const mode of ["denied", "rpc-error", "allowed"]) {
      let loaded = false;
      const guard = createMembershipGuard(async () => {
        expect(loaded).to.be.false;
        if (mode === "rpc-error") throw new Error("RPC unavailable");
        return mode === "allowed";
      });
      const operation = guard.loadPremiumContent({
        lockAddress: TEST_CREATOR_LOCK,
        authenticatedWalletAddress: buyer,
        load: async () => {
          loaded = true;
          return "premium";
        },
      });
      if (mode === "allowed") {
        expect(await operation).to.equal("premium");
      } else {
        let threw = false;
        try {
          await operation;
        } catch {
          threw = true;
        }
        expect(threw).to.be.true;
      }
      expect(loaded).to.equal(mode === "allowed");
    }
  });
});
