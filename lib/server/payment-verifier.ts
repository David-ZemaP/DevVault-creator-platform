import { Contract, Interface, ZeroAddress, hexlify, toUtf8Bytes, type Provider } from 'ethers';
import { PUBLIC_LOCK_ABI, PURCHASE_SIGNATURE } from '../web3/abis';
import { HSK_CHAIN_ID, UNLOCK_ADDRESS } from '../web3/hsk';
import { assertHsk, getHskProvider } from '../web3/membership';
import { HttpError } from './marketplace-db';
const abi = new Interface([...PUBLIC_LOCK_ABI, 'event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)']);
export const paymentReference = (id: string) => hexlify(toUtf8Bytes(`devvault:source:${id}`));
const eq = (a?: string | null, b?: string | null) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());
export interface PaymentProject { id: string; creatorWallet: string; lockAddress?: string; priceWei?: string; publishedAt?: string }
export async function checkPaymentConfig(project: PaymentProject, provider: Provider = getHskProvider()) {
  await assertHsk(provider);
  if (!project.lockAddress || !project.priceWei || BigInt(project.priceWei) <= 0n) throw new HttpError(400, 'A paid HSK lock is required');
  const lock = new Contract(project.lockAddress, [...PUBLIC_LOCK_ABI, 'function isLockManager(address) view returns(bool)'], provider);
  const factory = new Contract(UNLOCK_ADDRESS, ['function locks(address) view returns(bool deployed,uint256 totalSales,uint256 yieldedDiscountTokens)'], provider);
  const [version, token, price, manager, registered] = await Promise.all([
    lock.publicLockVersion(), lock.tokenAddress(), lock.keyPrice(), lock.isLockManager(project.creatorWallet), factory.locks(project.lockAddress),
  ]);
  if (version !== 15n || token !== ZeroAddress || !manager || !registered.deployed || price.toString() !== project.priceWei) {
    throw new HttpError(400, 'Expected a creator-managed native HSK PublicLock v15 from the configured Unlock factory, with matching price');
  }
}
/** Pure receipt/calldata validation, independently exercised with mocked RPC evidence. */
export function validatePaymentEvidence(project: PaymentProject, buyer: string, evidence: {
  chainId: bigint; head: number;
  tx: { from: string; to: string | null; value: bigint; data: string; chainId: bigint; hash: string } | null;
  receipt: { status: number | null; blockNumber: number; hash: string; logs: ReadonlyArray<{ address: string; topics: readonly string[]; data: string }> } | null;
  block: { timestamp: number; hash: string | null } | null;
}, confirmations = 2) {
  const { tx, receipt, block } = evidence;
  const bad = () => { throw new HttpError(400, 'Transaction does not prove payment for this project and wallet'); };
  if (evidence.chainId !== BigInt(HSK_CHAIN_ID) || !tx || !receipt || !block || tx.chainId !== BigInt(HSK_CHAIN_ID) || receipt.status !== 1 || !eq(tx.hash, receipt.hash)) return bad();
  if (evidence.head - receipt.blockNumber + 1 < confirmations) throw new HttpError(409, 'Waiting for confirmations');
  if (!eq(tx.from, buyer) || !eq(tx.to, project.lockAddress) || !project.priceWei || tx.value !== BigInt(project.priceWei)) return bad();
  if (!project.publishedAt || block.timestamp * 1000 < Date.parse(project.publishedAt)) return bad();
  let call;
  try { call = abi.parseTransaction({ data: tx.data, value: tx.value }); } catch { return bad(); }
  if (call?.signature !== PURCHASE_SIGNATURE || call.args[0].length !== 1) return bad();
  const arg = call.args[0][0];
  if (!eq(arg.recipient, buyer) || arg.data !== paymentReference(project.id) || arg.additionalPeriods !== 0n || arg.value !== 0n || !eq(arg.keyManager, ZeroAddress)) return bad();
  const minted = receipt.logs.some(log => {
    if (!eq(log.address, project.lockAddress)) return false;
    try { const event = abi.parseLog(log); return event?.name === 'Transfer' && eq(event.args.from, ZeroAddress) && eq(event.args.to, buyer); } catch { return false; }
  });
  if (!minted) return bad();
  return { confirmedBlock: receipt.blockNumber, amount: tx.value.toString() };
}
export interface MembershipEvidence {
  chainId: bigint;
  tx: { from: string; to: string | null; data: string; hash: string } | null;
  receipt: { status: number | null; blockNumber: number; hash: string } | null;
}

/** Pure synchronous validation of a PublicLock purchase transaction for article membership gating. */
export function validateMembershipEvidence(
  lockAddress: string,
  buyerWallet: string,
  evidence: MembershipEvidence,
): { confirmedBlock: number } {
  const { tx, receipt } = evidence;
  const bad = (msg: string): never => { throw new HttpError(422, msg); };
  if (evidence.chainId !== BigInt(HSK_CHAIN_ID)) throw bad('Transaction is not on HashKey Testnet');
  if (!tx || !receipt) throw bad('Transaction not found on HashKey network');
  if (receipt.status !== 1) throw bad('Transaction failed');
  if (!eq(tx.hash, receipt.hash)) throw bad('Receipt does not match transaction');
  if (!eq(tx.from, buyerWallet)) throw bad('Transaction sender does not match authenticated wallet');
  if (!lockAddress || !eq(tx.to, lockAddress)) throw bad('Transaction target does not match publication lock');
  let parsedCall;
  try { parsedCall = abi.parseTransaction({ data: tx.data }); } catch { throw bad('Could not decode transaction calldata'); }
  if (!parsedCall || parsedCall.name !== 'purchase') throw bad('Transaction is not a PublicLock purchase');
  const purchaseArgs = parsedCall.args[0];
  if (!Array.isArray(purchaseArgs) || purchaseArgs.length === 0) throw bad('Invalid purchase arguments');
  const recipient: unknown = (purchaseArgs[0] as Record<string, unknown>)?.recipient;
  if (typeof recipient !== 'string' || !eq(recipient, buyerWallet)) throw bad('Purchase recipient does not match authenticated wallet');
  return { confirmedBlock: receipt.blockNumber };
}
export async function verifyPayment(project: PaymentProject, buyer: string, hash: string, provider: Provider = getHskProvider()) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new HttpError(400, 'Invalid transaction hash');
  const [network, tx, receipt, head] = await Promise.all([provider.getNetwork(), provider.getTransaction(hash), provider.getTransactionReceipt(hash), provider.getBlockNumber()]);
  const block = receipt ? await provider.getBlock(receipt.blockNumber) : null;
  if (receipt && block?.hash !== receipt.blockHash) throw new HttpError(409, 'Receipt is not in the canonical chain');
  return validatePaymentEvidence(project, buyer, { chainId: network.chainId, tx, receipt, head, block });
}
