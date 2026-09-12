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
    for (const value of ['javascript:alert(1)', 'data:text/html,x', '/source.zip', 'https://user:pass@example.com']) expect(safeUrl(value)).eq(undefined);
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
    dbModule.commerceDb = () => ({ from: () => ({ insert: async (row: any) => { if (records.some(r => r.transaction_hash === row.transaction_hash)) return { error: { code: '23505' } }; records.push(row); return { error: null }; } }) });
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
});

describe('Wallet authentication binding', () => {
  const headers = require('next/headers');
  const dbModule = require('../lib/server/marketplace-db');
  const authRoute = require('../app/api/auth/[action]/route');
  const sessionModule = require('../lib/server/wallet-session');
  const { Wallet } = require('ethers');
  const originalDb = dbModule.commerceDb, originalCookies = headers.cookies, originalOrigin = process.env.APP_ORIGIN;
  let rows: Record<string, any[]>, jar: Map<string, string>;
  beforeEach(() => {
    process.env.APP_ORIGIN = 'http://localhost:3000'; rows = {}; jar = new Map();
    headers.cookies = async () => ({ get: (key: string) => jar.has(key) ? { value: jar.get(key) } : undefined, set: (key: string, value: string) => jar.set(key, value), delete: (key: string) => jar.delete(key) });
    dbModule.commerceDb = () => ({ from: (table: string) => {
      rows[table] ||= []; const filters: ((r: any) => boolean)[] = []; let removing = false;
      const query: any = {
        insert: async (row: any) => { rows[table].push(row); return { data: null, error: null }; },
        delete: () => { removing = true; return query; }, select: () => query,
        eq: (key: string, value: any) => { filters.push(r => r[key] === value); return query; },
        gt: (key: string, value: any) => { filters.push(r => r[key] > value); return query; },
        maybeSingle: async () => { const data = rows[table].find(r => filters.every(f => f(r))) || null; if (removing && data) rows[table] = rows[table].filter(r => r !== data); return { data, error: null }; },
      }; return query;
    } });
  });
  after(() => { headers.cookies = originalCookies; dbModule.commerceDb = originalDb; if (originalOrigin === undefined) delete process.env.APP_ORIGIN; else process.env.APP_ORIGIN = originalOrigin; });
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
  let SourcePurchase: any, PurchaseLibrary: any, SoftwareDemoRunner: any;
  before(() => {
    Module._load = function(name: string, ...rest: any[]) {
      if (name === 'wagmi') return { useAccount: () => ({ address: connected ? buyer : undefined, isConnected: connected }), useWalletClient: () => ({}), useSwitchChain: () => ({}), useSignMessage: () => ({}) };
      if (name === '@rainbow-me/rainbowkit') return { useConnectModal: () => ({}) };
      return originalLoad.call(this, name, ...rest);
    };
    SourcePurchase = require('../components/content/source-purchase').SourcePurchase;
    PurchaseLibrary = require('../components/content/purchase-library').PurchaseLibrary;
    SoftwareDemoRunner = require('../components/content/software-demo-runner').SoftwareDemoRunner;
    React.useState = (initial: any) => [cursor < stateValues.length ? stateValues[cursor++] : initial, () => {}];
  });
  after(() => { Module._load = originalLoad; React.useState = originalState; });
  beforeEach(() => { connected = true; cursor = 0; stateValues = []; });
  const render = (component: any, props: any) => renderToStaticMarkup(React.createElement(component, props));
  it('shows public demo before purchase without embedding creator code', () => { const html = render(SoftwareDemoRunner, { title: 'Example', projectType: 'software', demoUrl: project.demoUrl }); expect(html).contains('Open live demo'); expect(html).contains('noopener noreferrer'); expect(html).not.contains('<iframe'); });
  it('hides source access for visitors and non-buyers', () => { connected = false; let html = render(SourcePurchase, { id: project.id, priceWei: '100' }); expect(html).contains('Connect wallet to purchase'); expect(html).not.contains('Access source code'); connected = true; cursor = 0; html = render(SourcePurchase, { id: project.id }); expect(html).contains('Buy source code'); expect(html).not.contains('Access source code'); });
  it('shows waiting state without source access', () => { stateValues = [{ creator: false, purchased: false }, true, '', '']; const html = render(SourcePurchase, { id: project.id }); expect(html).contains('Waiting for confirmation'); expect(html).contains('disabled'); expect(html).not.contains('Access source code'); });
  it('confirmed buyer sees purchased badge and access', () => { stateValues = [{ creator: false, purchased: true }, false, '', hash]; const html = render(SourcePurchase, { id: project.id }); expect(html).contains('Purchased'); expect(html).contains('Access source code'); expect(html).contains('My Purchases'); expect(html).not.contains('Buy source code'); });
  it('renders subscription model states: unsubscribed, active, and expired', () => {
    let html = render(SourcePurchase, { id: project.id, priceWei: '10000000000000000000', acquisitionModel: 'subscription' });
    expect(html).contains('Monthly subscription (30 days)');
    expect(html).contains('Access to code &amp; updates while subscribed');
    expect(html).contains('Subscribe (10 HSK / 30 days)');

    cursor = 0;
    stateValues = [{ creator: false, purchased: true, isSubscription: true, hasActiveMembership: true }, false, '', hash];
    html = render(SourcePurchase, { id: project.id, priceWei: '10000000000000000000', acquisitionModel: 'subscription' });
    expect(html).contains('Subscribed · Active (30 days)');
    expect(html).contains('Access source code');
    expect(html).contains('Extend / Renew Subscription');

    cursor = 0;
    stateValues = [{ creator: false, purchased: true, isSubscription: true, hasActiveMembership: false }, false, '', ''];
    html = render(SourcePurchase, { id: project.id, priceWei: '10000000000000000000', acquisitionModel: 'subscription' });
    expect(html).contains('Subscription Expired');
    expect(html).contains('Subscription Expired · Renew (10 HSK)');
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
