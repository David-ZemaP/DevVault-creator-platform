import { expect } from 'chai';
import { Wallet } from 'ethers';
import { createWalletChallenge, verifyWalletChallenge } from '../lib/server/siwe';
import { AUTH_HEARTBEAT_MS, sessionMatchesWallet, type WalletSession } from '../lib/auth/constants';
import { installAuthGuard, marketplaceRequest } from '../lib/auth/request';

async function expectFailure(operation: Promise<unknown>, code: string) {
  try { await operation; expect.fail('Expected failure'); }
  catch (error) { expect((error as { code: string }).code).eq(code); }
}

describe('SIWE security boundaries', () => {
  const origin = 'http://localhost:3000';
  for (const field of ['domain', 'uri', 'nonce', 'chain', 'future', 'expired', 'address']) {
    it(`rejects a correctly signed message with invalid ${field}`, async () => {
      const wallet = Wallet.createRandom();
      const nonce = 'a'.repeat(64);
      let { message } = createWalletChallenge(wallet.address, 133, nonce, origin);
      if (field === 'domain') message = message.replace('localhost:3000 wants', 'attacker.example wants');
      if (field === 'uri') message = message.replace('URI: http://localhost:3000', 'URI: https://attacker.example');
      if (field === 'nonce') message = message.replace(nonce, 'b'.repeat(64));
      if (field === 'chain') message = message.replace('Chain ID: 133', 'Chain ID: 1');
      if (field === 'future' || field === 'expired') {
        message = createWalletChallenge(wallet.address, 133, nonce, origin, new Date(Date.now() + (field === 'future' ? 600000 : -600000))).message;
      }
      const row = { wallet: field === 'address' ? Wallet.createRandom().address : wallet.address, message };
      await expectFailure(verifyWalletChallenge(row, nonce, await wallet.signMessage(message), origin), 'INVALID_NONCE');
    });
  }
  it('rejects malformed signatures using the stable error contract', async () => {
    const wallet = Wallet.createRandom();
    const nonce = 'c'.repeat(64);
    const row = { wallet: wallet.address, ...createWalletChallenge(wallet.address, 133, nonce, origin) };
    await expectFailure(verifyWalletChallenge(row, nonce, 'garbage', origin), 'INVALID_SIGNATURE');
  });
});

describe('Client session and protected request boundary', () => {
  let wallet: string | undefined;
  let session: WalletSession | null;
  let calls: number;
  let release: () => void;
  let dispose: () => void;
  const originalFetch = global.fetch;
  beforeEach(() => {
    wallet = Wallet.createRandom().address.toLowerCase();
    session = { wallet, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString() };
    calls = 0;
    dispose = installAuthGuard({ wallet: () => wallet, session: () => session, invalidate: () => { session = null; } });
    global.fetch = async () => { calls++; return Response.json({ ok: true }); };
  });
  afterEach(() => { dispose(); global.fetch = originalFetch; });
  it('valid session allows protected requests', async () => { await marketplaceRequest('/purchases'); expect(calls).eq(1); });
  it('connected wallet with expired session requires reauthentication without sending a request', async () => {
    session!.expiresAt = new Date(Date.now() - 1).toISOString();
    expect(sessionMatchesWallet(session, wallet)).eq(false);
    await expectFailure(marketplaceRequest('/purchases'), 'REAUTH_REQUIRED');
    expect(calls).eq(0);
  });
  it('wallet changes immediately deny old identity', async () => {
    wallet = Wallet.createRandom().address.toLowerCase();
    await expectFailure(marketplaceRequest('/purchases'), 'REAUTH_REQUIRED');
    expect(calls).eq(0);
  });
  it('expired backend session clears client identity', async () => {
    global.fetch = async () => Response.json({ code: 'SESSION_EXPIRED', error: 'Re-authenticate wallet' }, { status: 401 });
    await expectFailure(marketplaceRequest('/purchases'), 'SESSION_EXPIRED');
    expect(session).eq(null);
    expect(wallet).not.eq(undefined);
  });
  it('discards an in-flight protected response after wallet change', async () => {
    global.fetch = async () => { await new Promise<void>(resolve => { release = resolve; }); return Response.json({ secret: true }); };
    const request = marketplaceRequest('/purchases');
    wallet = Wallet.createRandom().address.toLowerCase();
    release();
    await expectFailure(request, 'REAUTH_REQUIRED');
  });
  it('heartbeat interval is five minutes', () => expect(AUTH_HEARTBEAT_MS).eq(300000));
});
