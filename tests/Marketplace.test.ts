import { expect } from 'chai';
import { Interface, ZeroAddress } from 'ethers';
import { publicPublication, isPublic, safeUrl, purchaseState } from '../lib/marketplace/public';
import { PUBLIC_LOCK_ABI, PURCHASE_SIGNATURE } from '../lib/web3/abis';
import { validatePaymentEvidence, paymentReference } from '../lib/server/payment-verifier';
import type { PublicationRecord } from '../lib/supabase/types';
import { SOURCE_TTL_SECONDS } from '../lib/server/source-storage';
const buyer = '0x1111111111111111111111111111111111111111';
const seller = '0x2222222222222222222222222222222222222222';
const lock = '0x3333333333333333333333333333333333333333';
const hash = '0x' + 'a'.repeat(64);
const project: PublicationRecord = { id: 'project-one', creatorWallet: seller, title: 'Example', description: 'Public description', preview: 'Public demo', projectType: 'software', status: 'PUBLISHED', createdAt: '2026-09-01T00:00:00Z', publishedAt: '2026-09-01T00:00:00Z', priceWei: '100', lockAddress: lock, contentHash: '0x123', version: 1, demoUrl: 'https://demo.example.com', premiumContent: 'SECRET', zipUrl: 'PRIVATE', repositoryUrl: 'PRIVATE', demoPreviewCode: 'SECRET' };
const iface = new Interface([...PUBLIC_LOCK_ABI, 'event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)']);
function evidence() {
  const event = iface.encodeEventLog(iface.getEvent('Transfer')!, [ZeroAddress, buyer, 1]);
  return { chainId: 133n, head: 101, tx: { from: buyer, to: lock, value: 100n, data: iface.encodeFunctionData(PURCHASE_SIGNATURE, [[{ value: 0, recipient: buyer, referrer: ZeroAddress, protocolReferrer: ZeroAddress, keyManager: ZeroAddress, data: paymentReference(project.id), additionalPeriods: 0 }]]), chainId: 133n, hash }, receipt: { status: 1, blockNumber: 100, hash, logs: [{ address: lock, ...event }] }, block: { timestamp: Date.parse('2026-09-02T00:00:00Z') / 1000, hash: 'block' } };
}
describe('Marketplace public boundaries', () => {
  it('hides drafts, archived items and unmigrated software', () => {
    for (const status of ['DRAFT', 'ARCHIVED', undefined] as const) expect(isPublic({ ...project, status })).eq(false);
    expect(isPublic(project)).eq(true);
  });
  it('allows public demos but never serializes source fields', () => {
    const publicData = publicPublication(project);
    expect(publicData.demoUrl).eq('https://demo.example.com/');
    expect(JSON.stringify(publicData)).not.match(/SECRET|PRIVATE|zipUrl|repositoryUrl|premiumContent|demoPreviewCode|object_key/);
  });
  it('rejects executable URLs, relative URLs and embedded credentials', () => {
    for (const value of ['javascript:alert(1)', 'data:text/html,x', 'file:///tmp/source.zip', 'blob:https://example.com/123', 'http://example.com', 'http://127.0.0.1', 'not a URL', '/source.zip', 'https://user:pass@example.com']) expect(safeUrl(value)).eq(undefined);
  });
  it('never charges already purchased users or creators, including while pending', () => {
    expect(purchaseState(true, false, true, true)).eq('purchased');
    expect(purchaseState(true, true, false, false)).eq('creator');
    expect(purchaseState(false, false, false, false)).eq('connect');
    expect(purchaseState(true, false, false, true)).eq('pending');
    expect(purchaseState(true, false, false, false)).eq('buy');
  });
  it('projects acquisitionModel defaulting to lifetime', () => {
    expect(publicPublication(project).acquisitionModel).eq('lifetime');
    expect(publicPublication({ ...project, acquisitionModel: 'subscription' }).acquisitionModel).eq('subscription');
  });
  it('source access URL lifetime is ten minutes', () => expect(SOURCE_TTL_SECONDS).eq(600));
});
describe('Independent payment evidence verification', () => {
  it('accepts correct native HSK payment and mint without consulting membership expiry', () => expect(validatePaymentEvidence(project, buyer, evidence())).deep.eq({ amount: '100', confirmedBlock: 100 }));
  const mutations: Record<string, (e: ReturnType<typeof evidence>) => void> = {
    'wrong chain': e => { e.chainId = 1n; },
    'failed transaction': e => { e.receipt.status = 0; },
    'wrong buyer': e => { e.tx.from = seller; },
    'wrong amount': e => { e.tx.value = 99n; },
    'wrong contract': e => { e.tx.to = seller; },
    'missing mint': e => { e.receipt.logs = []; },
    'mint from another contract': e => { e.receipt.logs[0].address = seller; },
    'invalid calldata': e => { e.tx.data = '0xdead'; },
    'insufficient confirmations': e => { e.head = 100; },
    'prepublication payment': e => { e.block.timestamp = 1; },
    'mismatched receipt': e => { e.receipt.hash = '0x' + 'b'.repeat(64); },
  };
  for (const [name, mutate] of Object.entries(mutations)) it(`rejects ${name}`, () => { const e = evidence(); mutate(e); expect(() => validatePaymentEvidence(project, buyer, e)).throws(); });
  it('rejects reuse of the same payment for another project even on the same lock', () => expect(() => validatePaymentEvidence({ ...project, id: 'another-project' }, buyer, evidence())).throws());
  it('rejects nonexistent transaction', () => expect(() => validatePaymentEvidence(project, buyer, { ...evidence(), tx: null, receipt: null })).throws());
});

describe('Membership evidence validation', () => {
  const { validateMembershipEvidence } = require('../lib/server/payment-verifier');
  const { Interface, ZeroAddress } = require('ethers');
  const { PUBLIC_LOCK_ABI, PURCHASE_SIGNATURE } = require('../lib/web3/abis');
  const memberIface = new Interface(PUBLIC_LOCK_ABI);
  const memberLock = '0x4444444444444444444444444444444444444444';
  const memberHash = '0x' + 'c'.repeat(64);
  function membershipEvidence(overrides: Partial<{ chainId: bigint; tx: any; receipt: any }> = {}) {
    const data = memberIface.encodeFunctionData(PURCHASE_SIGNATURE, [[{ value: 0, recipient: buyer, referrer: ZeroAddress, protocolReferrer: ZeroAddress, keyManager: ZeroAddress, data: '0x', additionalPeriods: 0 }]]);
    return {
      chainId: 133n,
      tx: { from: buyer, to: memberLock, data, hash: memberHash },
      receipt: { status: 1, blockNumber: 200, hash: memberHash },
      ...overrides,
    };
  }
  it('accepts valid purchase evidence', () => {
    expect(validateMembershipEvidence(memberLock, buyer, membershipEvidence())).deep.eq({ confirmedBlock: 200 });
  });
  const cases: [string, Partial<{ chainId: bigint; tx: any; receipt: any }>][] = [
    ['wrong chain', { chainId: 1n }],
    ['missing tx', { tx: null }],
    ['missing receipt', { receipt: null }],
    ['failed receipt', { receipt: { status: 0, blockNumber: 200, hash: memberHash } }],
    ['wrong sender', { tx: { from: seller, to: memberLock, data: memberIface.encodeFunctionData(PURCHASE_SIGNATURE, [[{ value: 0, recipient: buyer, referrer: ZeroAddress, protocolReferrer: ZeroAddress, keyManager: ZeroAddress, data: '0x', additionalPeriods: 0 }]]), hash: memberHash } }],
    ['wrong target', { tx: { from: buyer, to: seller, data: memberIface.encodeFunctionData(PURCHASE_SIGNATURE, [[{ value: 0, recipient: buyer, referrer: ZeroAddress, protocolReferrer: ZeroAddress, keyManager: ZeroAddress, data: '0x', additionalPeriods: 0 }]]), hash: memberHash } }],
    ['wrong recipient', { tx: { from: buyer, to: memberLock, data: memberIface.encodeFunctionData(PURCHASE_SIGNATURE, [[{ value: 0, recipient: seller, referrer: ZeroAddress, protocolReferrer: ZeroAddress, keyManager: ZeroAddress, data: '0x', additionalPeriods: 0 }]]), hash: memberHash } }],
    ['invalid calldata', { tx: { from: buyer, to: memberLock, data: '0xdeadbeef', hash: memberHash } }],
  ];
  for (const [name, override] of cases) {
    it(`rejects ${name}`, () => expect(() => validateMembershipEvidence(memberLock, buyer, membershipEvidence(override))).throws());
  }
});

describe('Lock on-chain data validation', () => {
  const { validateLockData } = require('../lib/server/project-service');
  const { ZeroAddress, getAddress } = require('ethers');
  const { UNLOCK_ADDRESS } = require('../lib/web3/hsk');
  const testLock = '0x5555555555555555555555555555555555555555';
  function valid(): import('../lib/server/project-service').LockOnChainData {
    return { hasCode: true, version: 15n, tokenAddress: ZeroAddress, keyPrice: 200n, isLockManager: true, registeredWithFactory: true };
  }
  it('accepts valid lock data and returns priceWei', () => {
    expect(validateLockData(testLock, valid())).deep.eq({ priceWei: '200' });
  });
  const lockCases: [string, Partial<import('../lib/server/project-service').LockOnChainData>][] = [
    ['no contract code', { hasCode: false }],
    ['wrong version (14)', { version: 14n }],
    ['ERC-20 token (not native)', { tokenAddress: testLock }],
    ['creator is not lock manager', { isLockManager: false }],
    ['not registered with factory', { registeredWithFactory: false }],
  ];
  for (const [name, override] of lockCases) {
    it(`rejects ${name}`, () => expect(() => validateLockData(testLock, { ...valid(), ...override })).throws());
  }
});

// Exercise the real route handlers with durable-store/RPC/session boundaries mocked.
describe('Marketplace routes', () => {
  const dbModule = require('../lib/server/marketplace-db');
  const auth = require('../lib/server/wallet-session');
  const verifier = require('../lib/server/payment-verifier');
  const storage = require('../lib/server/source-storage');
  const server = require('../lib/supabase/server');
  const actions = require('../app/api/publications/[id]/[action]/route');
  const detail = require('../app/api/publications/[id]/route');
  const original = { wallet: auth.authenticatedWallet, origin: auth.sameOrigin, load: dbModule.loadProject, entitlement: dbModule.entitlement, db: dbModule.commerceDb, verify: verifier.verifyPayment, check: verifier.checkPaymentConfig, download: storage.sourceStorage.download, get: server.serverDb.publications.getById };
  let session: string | null, records: any[], downloads: number;
  const props = (action: string) => ({ params: Promise.resolve({ id: project.id, action }) });
  const request = () => new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionHash: hash, buyerWallet: seller }) });
  beforeEach(() => {
    session = buyer; records = []; downloads = 0;
    auth.authenticatedWallet = async () => { if (!session) throw new dbModule.HttpError(401, 'Sign in'); return session; };
    auth.sameOrigin = () => {};
    dbModule.loadProject = async () => project;
    dbModule.entitlement = async (id: string, wallet: string) => records.find(r => r.project_id === id && r.buyer_wallet === wallet);
    const updateChain: any = { eq: () => updateChain, then: (resolve: any) => Promise.resolve({ data: null, error: null }).then(resolve) };
    dbModule.commerceDb = () => ({ from: () => ({ insert: async (row: any) => { if (records.some(r => r.transaction_hash === row.transaction_hash)) return { error: { code: '23505' } }; records.push(row); return { error: null }; }, update: () => updateChain }) });
    verifier.verifyPayment = async (p: any, wallet: string) => validatePaymentEvidence(p, wallet, evidence());
    verifier.checkPaymentConfig = async () => {};
    storage.sourceStorage.download = async () => { downloads++; return { url: 'https://storage.example.com/signed?token=temporary', expiresIn: 600 }; };
    server.serverDb.publications.getById = async () => project;
  });
  after(() => { auth.authenticatedWallet = original.wallet; auth.sameOrigin = original.origin; dbModule.loadProject = original.load; dbModule.entitlement = original.entitlement; dbModule.commerceDb = original.db; verifier.verifyPayment = original.verify; verifier.checkPaymentConfig = original.check; storage.sourceStorage.download = original.download; server.serverDb.publications.getById = original.get; });
  it('public endpoint exposes demos and excludes every source field', async () => { const res = await detail.GET(request(), props('')); expect(res.status).eq(200); expect(await res.text()).not.match(/SECRET|PRIVATE|object_key/); });
  it('draft detail returns 404', async () => { server.serverDb.publications.getById = async () => ({ ...project, status: 'DRAFT' }); expect((await detail.GET(request(), props(''))).status).eq(404); });
  it('unauthenticated verification is rejected', async () => { session = null; expect((await actions.POST(request(), props('verify'))).status).eq(401); expect(records).length(0); });
  it('valid payment creates permanent entitlement and repeated requests are idempotent', async () => {
    expect((await actions.POST(request(), props('verify'))).status).eq(200);
    expect((await actions.POST(request(), props('verify'))).status).eq(200);
    expect(records).length(1); expect(records[0].buyer_wallet).eq(buyer);
  });
  it('database transaction uniqueness rejects replay', async () => {
    records.push({ project_id: 'other', buyer_wallet: buyer, transaction_hash: hash });
    expect((await actions.POST(request(), props('verify'))).status).eq(409); expect(records).length(1);
  });
  it('invalid payment never creates entitlement', async () => { verifier.verifyPayment = async () => { throw new dbModule.HttpError(400, 'Invalid payment'); }; expect((await actions.POST(request(), props('verify'))).status).eq(400); expect(records).length(0); });
  it('public visitors and non-buyers cannot obtain a source URL', async () => { session = null; expect((await actions.GET(request(), props('source'))).status).eq(401); session = buyer; expect((await actions.GET(request(), props('source'))).status).eq(403); expect(downloads).eq(0); });
  it('confirmed buyer gets temporary source URL with no-store headers', async () => { records.push({ project_id: project.id, buyer_wallet: buyer }); const response = await actions.GET(request(), props('source')); expect(response.status).eq(200); expect(response.headers.get('cache-control')).contains('no-store'); expect((await response.json()).expiresIn).eq(600); expect(downloads).eq(1); });
  it('creator gets access without buying', async () => { session = seller; expect((await actions.GET(request(), props('source'))).status).eq(200); });
  it('another wallet cannot manage a creator project', async () => { expect((await actions.POST(request(), props('publish'))).status).eq(403); });
  it('already purchased checkout returns access instead of requesting another payment', async () => { records.push({ project_id: project.id, buyer_wallet: buyer }); const response = await actions.POST(request(), props('checkout')); expect((await response.json()).purchased).eq(true); });
  it('checkout returns acquisitionModel', async () => {
    const response = await actions.POST(request(), props('checkout'));
    expect(response.status).eq(200);
    const body = await response.json();
    expect(body.acquisitionModel).eq('lifetime');
  });
  it('access and source handle subscription model and onchain membership', async () => {
    const resLifetime = await actions.GET(request(), props('access'));
    expect(resLifetime.status).eq(200);
    expect((await resLifetime.json()).isSubscription).eq(false);

    const subProject = { ...project, acquisitionModel: 'subscription' as const };
    dbModule.loadProject = async () => subProject;
    const membership = require('../lib/web3/membership');
    const origHasMembership = membership.hasMembership;
    membership.hasMembership = async () => true;
    try {
      const resSub = await actions.GET(request(), props('access'));
      expect(resSub.status).eq(200);
      const subBody = await resSub.json();
      expect(subBody.isSubscription).eq(true);
      expect(subBody.hasActiveMembership).eq(true);

      const sourceRes = await actions.GET(request(), props('source'));
      expect(sourceRes.status).eq(200);

      membership.hasMembership = async () => false;
      const deniedSource = await actions.GET(request(), props('source'));
      expect(deniedSource.status).eq(403);
      expect((await deniedSource.json()).error).contains('Active subscription required');
    } finally {
      membership.hasMembership = origHasMembership;
    }
  });
  it('creator accesses premium content without membership check', async () => {
    const articleProject = { ...project, projectType: 'article' as const, lockAddress: lock, premiumContent: 'SECRET PREMIUM' };
    dbModule.loadProject = async () => articleProject;
    session = seller;
    const membership = require('../lib/web3/membership');
    const orig = membership.hasMembership;
    let called = false;
    membership.hasMembership = async () => { called = true; return false; };
    try {
      const res = await actions.GET(request(), props('premium'));
      expect(res.status).eq(200);
      expect((await res.json()).premiumContent).eq('SECRET PREMIUM');
      expect(called).eq(false);
    } finally { membership.hasMembership = orig; }
  });
  it('active member accesses premium content', async () => {
    const articleProject = { ...project, projectType: 'article' as const, lockAddress: lock, premiumContent: 'SECRET PREMIUM' };
    dbModule.loadProject = async () => articleProject;
    const membership = require('../lib/web3/membership');
    const orig = membership.hasMembership;
    membership.hasMembership = async () => true;
    try {
      const res = await actions.GET(request(), props('premium'));
      expect(res.status).eq(200);
      expect((await res.json()).premiumContent).eq('SECRET PREMIUM');
    } finally { membership.hasMembership = orig; }
  });
  it('non-member cannot access premium content', async () => {
    const articleProject = { ...project, projectType: 'article' as const, lockAddress: lock, premiumContent: 'SECRET PREMIUM' };
    dbModule.loadProject = async () => articleProject;
    const membership = require('../lib/web3/membership');
    const orig = membership.hasMembership;
    membership.hasMembership = async () => false;
    try {
      const res = await actions.GET(request(), props('premium'));
      expect(res.status).eq(403);
    } finally { membership.hasMembership = orig; }
  });
  it('premium without lock address returns 400', async () => {
    dbModule.loadProject = async () => ({ ...project, lockAddress: undefined });
    const res = await actions.GET(request(), props('premium'));
    expect(res.status).eq(400);
  });
  it('membership-verify accepts valid purchase and confirmed membership', async () => {
    const { Interface, ZeroAddress } = require('ethers');
    const { PUBLIC_LOCK_ABI: PLA, PURCHASE_SIGNATURE: PS } = require('../lib/web3/abis');
    const mIface = new Interface(PLA);
    const data = mIface.encodeFunctionData(PS, [[{ value: 0, recipient: buyer, referrer: ZeroAddress, protocolReferrer: ZeroAddress, keyManager: ZeroAddress, data: '0x', additionalPeriods: 0 }]]);
    const membership = require('../lib/web3/membership');
    const origProvider = membership.getHskProvider;
    const origHas = membership.hasMembership;
    membership.getHskProvider = () => ({
      getNetwork: async () => ({ chainId: 133n }),
      getTransaction: async () => ({ from: buyer, to: lock, data, hash }),
      getTransactionReceipt: async () => ({ status: 1, blockNumber: 100, hash }),
    });
    membership.hasMembership = async () => true;
    try {
      const verifyReq = new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionHash: hash }) });
      const res = await actions.POST(verifyReq, props('membership-verify'));
      expect(res.status).eq(200);
      expect((await res.json()).verified).eq(true);
    } finally {
      membership.getHskProvider = origProvider;
      membership.hasMembership = origHas;
    }
  });
  it('membership-verify rejects when lock is not configured', async () => {
    dbModule.loadProject = async () => ({ ...project, lockAddress: undefined });
    const verifyReq = new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionHash: hash }) });
    expect((await actions.POST(verifyReq, props('membership-verify'))).status).eq(400);
  });
  it('membership-verify rejects wrong tx sender', async () => {
    const { Interface, ZeroAddress } = require('ethers');
    const { PUBLIC_LOCK_ABI: PLA, PURCHASE_SIGNATURE: PS } = require('../lib/web3/abis');
    const mIface = new Interface(PLA);
    const data = mIface.encodeFunctionData(PS, [[{ value: 0, recipient: buyer, referrer: ZeroAddress, protocolReferrer: ZeroAddress, keyManager: ZeroAddress, data: '0x', additionalPeriods: 0 }]]);
    const membership = require('../lib/web3/membership');
    const origProvider = membership.getHskProvider;
    membership.getHskProvider = () => ({
      getNetwork: async () => ({ chainId: 133n }),
      getTransaction: async () => ({ from: seller, to: lock, data, hash }),
      getTransactionReceipt: async () => ({ status: 1, blockNumber: 100, hash }),
    });
    try {
      const verifyReq = new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionHash: hash }) });
      expect((await actions.POST(verifyReq, props('membership-verify'))).status).eq(422);
    } finally { membership.getHskProvider = origProvider; }
  });
  it('membership-verify rejects when membership not active at receipt block', async () => {
    const { Interface, ZeroAddress } = require('ethers');
    const { PUBLIC_LOCK_ABI: PLA, PURCHASE_SIGNATURE: PS } = require('../lib/web3/abis');
    const mIface = new Interface(PLA);
    const data = mIface.encodeFunctionData(PS, [[{ value: 0, recipient: buyer, referrer: ZeroAddress, protocolReferrer: ZeroAddress, keyManager: ZeroAddress, data: '0x', additionalPeriods: 0 }]]);
    const membership = require('../lib/web3/membership');
    const origProvider = membership.getHskProvider;
    const origHas = membership.hasMembership;
    membership.getHskProvider = () => ({
      getNetwork: async () => ({ chainId: 133n }),
      getTransaction: async () => ({ from: buyer, to: lock, data, hash }),
      getTransactionReceipt: async () => ({ status: 1, blockNumber: 100, hash }),
    });
    membership.hasMembership = async () => false;
    try {
      const verifyReq = new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionHash: hash }) });
      expect((await actions.POST(verifyReq, props('membership-verify'))).status).eq(422);
    } finally {
      membership.getHskProvider = origProvider;
      membership.hasMembership = origHas;
    }
  });
  it('subscription article requires lock before publishing', async () => {
    const subArticle = { ...project, projectType: 'article' as const, acquisitionModel: 'subscription' as const, lockAddress: undefined, status: 'DRAFT' as const };
    dbModule.loadProject = async () => subArticle;
    session = seller;
    const res = await actions.POST(request(), props('publish'));
    expect(res.status).eq(400);
    expect((await res.json()).error).contains('membership contract');
  });
  it('lifetime article publishes without lock', async () => {
    const lifetimeArticle = { ...project, projectType: 'article' as const, acquisitionModel: 'lifetime' as const, lockAddress: undefined, status: 'DRAFT' as const };
    dbModule.loadProject = async () => lifetimeArticle;
    session = seller;
    const res = await actions.POST(request(), props('publish'));
    expect(res.status).eq(200);
  });
  it('set-lock saves validated lock address and returns it', async () => {
    const projectService = require('../lib/server/project-service');
    const origValidate = projectService.validateAndSaveLock;
    projectService.validateAndSaveLock = async () => ({ lockAddress: lock, priceWei: '200' });
    try {
      const setLockReq = new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lockAddress: lock }) });
      const res = await actions.POST(setLockReq, props('set-lock'));
      expect(res.status).eq(200);
      const body = await res.json();
      expect(body.lockAddress).eq(lock);
      expect(body.priceWei).eq('200');
    } finally { projectService.validateAndSaveLock = origValidate; }
  });
  it('set-lock is rejected for non-creator', async () => {
    const projectService = require('../lib/server/project-service');
    const origValidate = projectService.validateAndSaveLock;
    projectService.validateAndSaveLock = async () => { throw new dbModule.HttpError(403, 'Only the creator can configure a membership lock'); };
    try {
      const setLockReq = new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lockAddress: lock }) });
      session = buyer;
      const res = await actions.POST(setLockReq, props('set-lock'));
      expect(res.status).eq(403);
    } finally { projectService.validateAndSaveLock = origValidate; }
  });
  it('set-lock is rejected when unauthenticated', async () => {
    session = null;
    const setLockReq = new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lockAddress: lock }) });
    const res = await actions.POST(setLockReq, props('set-lock'));
    expect(res.status).eq(401);
  });
});

describe('Wallet authentication binding', () => {
  const headers = require('next/headers');
  const dbModule = require('../lib/server/marketplace-db');
  const authRoute = require('../app/api/auth/[action]/route');
  const sessionModule = require('../lib/server/wallet-session');
  const { Wallet } = require('ethers');
  const originalDb = dbModule.commerceDb, originalCookies = headers.cookies, originalHeaders = headers.headers, originalOrigin = process.env.APP_ORIGIN;
  let rows: Record<string, any[]>, jar: Map<string, string>;
  beforeEach(() => {
    process.env.APP_ORIGIN = 'http://localhost:3000'; rows = {}; jar = new Map();
    headers.headers = async () => new Headers();
    headers.cookies = async () => ({ get: (key: string) => jar.has(key) ? { value: jar.get(key) } : undefined, set: (key: string, value: string) => value ? jar.set(key, value) : jar.delete(key), delete: (key: string) => jar.delete(key) });
    dbModule.commerceDb = () => ({ from: (table: string) => {
      rows[table] ||= []; const filters: ((r: any) => boolean)[] = []; let removing = false;
      const query: any = {
        insert: async (row: any) => { rows[table].push(row); return { data: null, error: null }; },
        delete: () => { removing = true; return query; }, select: () => query,
        eq: (key: string, value: any) => { filters.push(r => r[key] === value); return query; },
        gt: (key: string, value: any) => { filters.push(r => r[key] > value); return query; },
        maybeSingle: async () => { const data = rows[table].find(r => filters.every(f => f(r))) || null; if (removing && data) rows[table] = rows[table].filter(r => r !== data); return { data, error: null }; },
      };
      query.then = (resolve: any) => { if (removing) rows[table] = rows[table].filter(r => !filters.every(f => f(r))); return Promise.resolve({ data: null, error: null }).then(resolve); };
      return query;
    } });
  });
  after(() => { headers.cookies = originalCookies; headers.headers = originalHeaders; dbModule.commerceDb = originalDb; if (originalOrigin === undefined) delete process.env.APP_ORIGIN; else process.env.APP_ORIGIN = originalOrigin; });
  async function post(action: string, body: any, origin = 'http://localhost:3000') {
    return authRoute.POST(new Request('http://localhost:3000/api/auth/' + action, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) }), { params: Promise.resolve({ action }) });
  }
  it('binds the session to the wallet that signed, ignoring a claimed buyer wallet', async () => {
    const wallet = Wallet.createRandom();
    const nonce = await post('nonce', { wallet: wallet.address });
    const { message } = await nonce.json();
    expect(message).contains('localhost:3000');
    const signature = await wallet.signMessage(message);
    const result = await post('verify', { signature, wallet: seller });
    expect(result.status).eq(200); expect(await sessionModule.authenticatedWallet()).eq(wallet.address.toLowerCase());
    expect(rows.wallet_challenges).length(0);
    expect(rows.wallet_sessions[0].token_hash).not.eq(jar.get('dv_session'));
    expect((await post('verify', { signature })).status).eq(401);
  });
  async function signIn() {
    const wallet = Wallet.createRandom();
    const { message } = await (await post('nonce', { wallet: wallet.address, chainId: 133 })).json();
    const response = await post('verify', { signature: await wallet.signMessage(message) });
    expect(response.status).eq(200);
    return wallet;
  }
  it('uses a two-hour hard expiry and heartbeat does not extend it', async () => {
    await signIn();
    const row = rows.wallet_sessions[0];
    expect(Date.parse(row.expires_at) - Date.parse(row.created_at)).eq(2 * 60 * 60 * 1000);
    const expires = row.expires_at;
    const response = await authRoute.GET(new Request('http://localhost:3000/api/auth/session'), { params: Promise.resolve({ action: 'session' }) });
    expect(response.status).eq(200);
    expect((await response.json()).expiresAt).eq(expires);
    expect(row.expires_at).eq(expires);
  });
  it('logout revokes the stored token, including a copied cookie', async () => {
    await signIn();
    const copied = jar.get('dv_session')!;
    expect((await post('logout', {})).status).eq(200);
    expect(rows.wallet_sessions).length(0);
    expect(jar.has('dv_session')).eq(false);
    jar.set('dv_session', copied);
    const response = await authRoute.GET(new Request('http://localhost:3000/api/auth/session'), { params: Promise.resolve({ action: 'session' }) });
    expect(response.status).eq(401);
    expect((await response.json()).code).eq('REAUTH_REQUIRED');
  });
  it('expired session cannot read private source', async () => {
    await signIn();
    rows.wallet_sessions[0].expires_at = new Date(Date.now() - 1).toISOString();
    const actions = require('../app/api/publications/[id]/[action]/route');
    const response = await actions.GET(new Request('http://localhost:3000/api/source'), { params: Promise.resolve({ id: project.id, action: 'source' }) });
    expect(response.status).eq(401);
    expect((await response.json()).code).eq('SESSION_EXPIRED');
  });
  it('a wallet mismatch fails before source storage is consulted', async () => {
    await signIn();
    headers.headers = async () => new Headers({ 'x-devvault-wallet': seller });
    const actions = require('../app/api/publications/[id]/[action]/route');
    const response = await actions.GET(new Request('http://localhost:3000/api/source'), { params: Promise.resolve({ id: project.id, action: 'source' }) });
    expect(response.status).eq(401);
    expect((await response.json()).code).eq('WALLET_CHANGED');
  });
  it('rejects malformed JSON and unsupported SIWE chains', async () => {
    expect((await post('nonce', { wallet: buyer, chainId: 1 })).status).eq(400);
    expect((await post('nonce', null)).status).eq(400);
  });
  it('rejects a signature from another wallet', async () => {
    const wallet = Wallet.createRandom(), attacker = Wallet.createRandom();
    const { message } = await (await post('nonce', { wallet: wallet.address })).json();
    expect((await post('verify', { signature: await attacker.signMessage(message) })).status).eq(401);
    expect(rows.wallet_sessions || []).length(0);
  });
  it('rejects expired and cross-origin challenges', async () => {
    expect((await post('nonce', { wallet: buyer }, 'https://attacker.example')).status).eq(403);
    const wallet = Wallet.createRandom(); const { message } = await (await post('nonce', { wallet: wallet.address })).json();
    rows.wallet_challenges[0].expires_at = '2000-01-01T00:00:00Z';
    expect((await post('verify', { signature: await wallet.signMessage(message) })).status).eq(401);
  });
});

describe('Rendered marketplace UI states', () => {
  const Module = require('node:module');
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const originalLoad = Module._load, originalState = React.useState;
  let stateValues: any[] = [], cursor = 0;
  let connected = true;
  const phases: string[] = [];
  let sent = 0;
  let receiptStatus = 'success';
  let SourcePurchase: any, PurchaseLibrary: any, SoftwareDemoRunner: any;
  before(() => {
    Module._load = function(name: string, ...rest: any[]) {
      if (name.endsWith('auth/use-auth')) return { useAuth: () => ({ isSessionAuthenticated: connected, authenticatedAddress: connected ? buyer : undefined, walletAddress: connected ? buyer : undefined, login: async () => {} }) };
      if (name === 'wagmi/actions') return { getAccount: () => ({ address: buyer }) };
      if (name === 'viem') return { ...originalLoad.call(this, name, ...rest), createPublicClient: () => ({ waitForTransactionReceipt: async () => ({ status: receiptStatus, transactionHash: hash }) }) };
      if (name === 'wagmi') return { useConfig: () => ({}), useAccount: () => ({ address: connected ? buyer : undefined, isConnected: connected, chainId: connected ? 133 : undefined }), useWalletClient: () => ({ data: { sendTransaction: async () => { sent++; return hash; } } }), useSwitchChain: () => ({ switchChainAsync: async () => {} }), useSignMessage: () => ({}) };
      if (name === '@rainbow-me/rainbowkit') return { useConnectModal: () => ({}) };
      return originalLoad.call(this, name, ...rest);
    };
    SourcePurchase = require('../components/content/source-purchase').SourcePurchase;
    PurchaseLibrary = require('../components/content/purchase-library').PurchaseLibrary;
    SoftwareDemoRunner = require('../components/content/software-demo-runner').SoftwareDemoRunner;
    React.useState = (initial: any) => [cursor < stateValues.length ? stateValues[cursor++] : initial, (value: unknown) => { if (typeof value === 'string' && ['connecting','awaiting_signature','submitted','confirming','verifying','confirmed','failed'].includes(value)) phases.push(value); }];
  });
  after(() => { Module._load = originalLoad; React.useState = originalState; });
  beforeEach(() => { connected = true; cursor = 0; stateValues = []; });
  const render = (component: any, props: any) => renderToStaticMarkup(React.createElement(component, props));
  it('shows public demo before purchase without embedding creator code', () => { const html = render(SoftwareDemoRunner, { title: 'Example', projectType: 'software', demoUrl: project.demoUrl }); expect(html).contains('Open Live Demo'); expect(html).contains('noopener noreferrer'); expect(html).contains('sandbox="allow-scripts"'); expect(html).contains('referrerPolicy="no-referrer"'); expect(html).not.contains('allow-same-origin'); });
  it('hides source access for visitors and non-buyers', () => {
    // Not connected: shows connect prompt
    connected = false;
    let html = render(SourcePurchase, { id: project.id, priceWei: '100' });
    expect(html).contains('Connect wallet');
    expect(html).not.contains('Access source code');
    // Connected but not purchased: shows buy button with price
    connected = true; cursor = 0;
    html = render(SourcePurchase, { id: project.id, priceWei: '100' });
    expect(html).contains('Buy Source Code');
    expect(html).contains('0.0000000000000001 HSK');
    expect(html).not.contains('Access source code');
  });
  it('shows waiting state without source access', () => {
    stateValues = [{ creator: false, purchased: false }, 'confirming', '', ''];
    const html = render(SourcePurchase, { id: project.id });
    expect(html).contains('Waiting for confirmation');
    expect(html).contains('disabled');
    expect(html).not.contains('Access source code');
  });
  it('confirmed buyer sees purchased badge and access', () => {
    stateValues = [{ creator: false, purchased: true }, 'idle', '', hash];
    const html = render(SourcePurchase, { id: project.id });
    expect(html).contains('Purchased');
    expect(html).contains('Access source code');
    expect(html).contains('My Purchases');
    expect(html).not.contains('Buy Source Code');
  });
  it('renders subscription model states: unsubscribed, active, and expired', () => {
    // Unsubscribed
    let html = render(SourcePurchase, { id: project.id, priceWei: '10000000000000000000', acquisitionModel: 'subscription' });
    expect(html).contains('30-day subscription');
    expect(html).contains('Access to code &amp; updates while subscribed');
    expect(html).contains('Subscribe — 10 HSK');

    // Active subscription
    cursor = 0;
    stateValues = [{ creator: false, purchased: true, isSubscription: true, hasActiveMembership: true }, 'idle', '', hash];
    html = render(SourcePurchase, { id: project.id, priceWei: '10000000000000000000', acquisitionModel: 'subscription' });
    expect(html).contains('Subscribed · Active');
    expect(html).contains('Access source code');
    expect(html).contains('Extend / Renew Subscription');

    // Expired subscription
    cursor = 0;
    stateValues = [{ creator: false, purchased: true, isSubscription: true, hasActiveMembership: false }, 'idle', '', ''];
    html = render(SourcePurchase, { id: project.id, priceWei: '10000000000000000000', acquisitionModel: 'subscription' });
    expect(html).contains('Subscription Expired');
    expect(html).contains('Subscription Expired · Renew — 10 HSK');
  });
  it('runs signing, confirmation, server verification and entitlement refresh without broadcasting', async () => {
    const requests = require('../lib/auth/request');
    const originalRequest = requests.marketplaceRequest;
    const originalWindow = globalThis.window;
    const originalStorage = globalThis.localStorage;
    const stored = new Map<string, string>();
    let verified = false;
    const execute = async (status: string, historical = false) => {
      receiptStatus = status; phases.length = 0; sent = 0; verified = false; cursor = 0;
      stateValues = [{ creator: false, purchased: false }, 'idle', '', historical ? hash : ''];
      let run: (download?: boolean) => Promise<void> = async () => {};
      const Capture = () => { const element = SourcePurchase({ id: project.id, priceWei: '100' }); run = element.props.run; return element; };
      render(Capture, {});
      await run();
    };
    try {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: { confirm: () => true } });
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => stored.get(key), setItem: (key: string, value: string) => stored.set(key, value), removeItem: (key: string) => stored.delete(key) } });
      requests.marketplaceRequest = async (path: string) => {
        if (path.endsWith('/access')) return { creator: false, purchased: verified };
        if (path.endsWith('/checkout')) return { title: 'Example', priceWei: '100', lockAddress: project.lockAddress, data: paymentReference(project.id) };
        if (path.endsWith('/verify')) { verified = true; return { purchased: true }; }
        throw new Error('Unexpected endpoint');
      };
      await execute('success', true);
      expect(sent).eq(1); // A displayed historical hash must not be treated as an unfinished payment.
      expect(verified).eq(true);
      expect(phases).deep.eq(['connecting', 'awaiting_signature', 'submitted', 'confirming', 'verifying', 'confirmed']);
      expect(stored.size).eq(0);
      await execute('reverted');
      expect(verified).eq(false);
      expect(phases.at(-1)).eq('failed');
      expect(phases).not.contains('verifying');
    } finally {
      requests.marketplaceRequest = originalRequest;
      Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    }
  });
  it('My Purchases displays project, price, transaction and source action', () => { stateValues = [[{ id: 'p1', project_id: project.id, publication: project, seller_wallet: seller, buyer_wallet: buyer, amount: '100', purchased_at: project.createdAt, transaction_hash: hash }], buyer, true, '', false]; const html = render(PurchaseLibrary, {}); expect(html).contains('Example'); expect(html).contains('View transaction'); expect(html).contains('Access source code'); expect(html).contains('Open project'); });
});

describe('Private storage adapter', () => {
  const dbModule = require('../lib/server/marketplace-db');
  const { sourceStorage } = require('../lib/server/source-storage');
  const originalDb = dbModule.commerceDb;
  let publicBucket = false, requestedTtl = 0;
  beforeEach(() => {
    publicBucket = false; requestedTtl = 0;
    dbModule.commerceDb = () => ({
      storage: { getBucket: async () => ({ data: { public: publicBucket }, error: null }), from: () => ({ createSignedUrl: async (_key: string, ttl: number) => { requestedTtl = ttl; return { data: { signedUrl: 'https://example.com/temporary?token=abc' }, error: null }; } }) },
      from: () => { const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { object_key: 'private-key.zip' }, error: null }) }; return q; },
    });
  });
  after(() => { dbModule.commerceDb = originalDb; });
  it('requests a 600-second signed URL and returns no standalone object key', async () => { const result = await sourceStorage.download(project.id); expect(requestedTtl).eq(600); expect(result.expiresIn).eq(600); expect(JSON.stringify(result)).not.contains('private-key'); });
  it('fails closed if the configured bucket becomes public', async () => { publicBucket = true; let rejected = false; try { await sourceStorage.download(project.id); } catch { rejected = true; } expect(rejected).eq(true); expect(requestedTtl).eq(0); });
});

// Phase 29 — no mock fallback when database is empty or unavailable
describe('No mock fallback policy', () => {
  const detailRoute = require('../app/api/publications/[id]/route');
  const serverModule = require('../lib/supabase/server');
  const original = { list: serverModule.serverDb.publications.list, getById: serverModule.serverDb.publications.getById };

  after(() => {
    serverModule.serverDb.publications.list = original.list;
    serverModule.serverDb.publications.getById = original.getById;
  });

  // Helper: simulate NextRequest (which has .nextUrl) for the /api/publications route
  function nextRequest(url: string) {
    const u = new URL(url);
    return Object.assign(new Request(u), { nextUrl: u });
  }

  it('serverDb.publications.list returns only what the database provides — empty when none', async () => {
    serverModule.serverDb.publications.list = async () => [];
    const result = await serverModule.serverDb.publications.list();
    expect(result).deep.eq([]);
    expect(JSON.stringify(result)).not.match(/membership-experiences|Designing a membership|fictional/);
  });

  it('serverDb.publications.list with real records does not inject mock titles', async () => {
    serverModule.serverDb.publications.list = async () => [{ ...project, status: 'PUBLISHED', publishedAt: project.publishedAt }];
    const result = await serverModule.serverDb.publications.list();
    expect(result).length(1);
    expect(result[0].title).eq(project.title);
    expect(JSON.stringify(result)).not.match(/Designing a membership|fictional|DEMO/);
  });

  it('Unknown content ID returns 404, not mock content', async () => {
    serverModule.serverDb.publications.getById = async () => null;
    const res = await detailRoute.GET(
      new Request('http://localhost/api/publications/unknown-id'),
      { params: Promise.resolve({ id: 'unknown-id' }) }
    );
    expect(res.status).eq(404);
    const body = await res.json();
    expect(JSON.stringify(body)).not.match(/Designing a membership|fictional|membership-experiences/);
  });

  it('Draft publication is not accessible via content route', async () => {
    serverModule.serverDb.publications.getById = async () => ({ ...project, status: 'DRAFT' });
    const res = await detailRoute.GET(
      new Request('http://localhost/api/publications/' + project.id),
      { params: Promise.resolve({ id: project.id }) }
    );
    expect(res.status).eq(404);
  });

  it('Supabase error causes serverDb to return empty, never mock data', async () => {
    serverModule.serverDb.publications.list = async () => {
      // simulate a caught DB error — the real serverDb logs and returns []
      return [];
    };
    const result = await serverModule.serverDb.publications.list();
    expect(result).deep.eq([]);
    expect(JSON.stringify(result)).not.match(/Designing a membership|fictional/);
  });
});
