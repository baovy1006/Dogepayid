import { isHash, toHex, type Address, type Hash, type Hex } from 'viem';
import { TARGET_CHAIN } from './config';

/** Only the SDK EVM provider bound to the *same* Wagmi address is eligible. */
export interface EvmSdkProvider {
  request(args: { method: string; params?: readonly unknown[] | object }): Promise<unknown>;
}
type Session = { address: Address; provider: EvmSdkProvider };
/** Only constant stage identifiers: no keys, signatures, amount, address or calldata. */
function trace(stage: string): void {
  console.info('[dogepay:wallet]', stage);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('dogepay:wallet-trace', { detail: { stage } }));
}
export class UnknownSdkSubmissionError extends Error {
  constructor() {
    super('Wallet submission status is unknown. Check your wallet history before retrying. Closing the popup does not cancel a broadcast.');
    this.name = 'UnknownSdkSubmissionError';
  }
}
function explicitlyRejected(error: unknown): boolean {
  const e = error as { code?: number | string; error?: { code?: number | string } } | null;
  return e?.code === 4001 || e?.code === 'ACTION_REJECTED' ||
    e?.error?.code === 4001 || e?.error?.code === 'ACTION_REJECTED';
}
async function readProvider(provider: EvmSdkProvider, method: string, params?: readonly unknown[] | object): Promise<unknown> {
  trace(method + ':requested');
  try {
    const value = await withReadDeadline(provider.request({ method, ...(params ? { params } : {}) }), method);
    trace(method + ':completed');
    return value;
  } catch (error) {
    trace(method + ':error');
    throw error;
  }
}
let session: Session | null = null;
export function setSdkSignerSession(next: Session | null) { session = next; }
export function sdkSignerFor(address: Address): Session | null {
  return session?.address.toLowerCase() === address.toLowerCase() ? session : null;
}

function withReadDeadline<T>(promise: Promise<T>, label: string): Promise<T> {
  // Only READ-only RPC calls use deadlines; NEVER time out/retry a signing RPC.
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`DogeOS Social Wallet did not answer ${label}. Reconnect X; no signing request was sent.`)), 8000);
    promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
  });
}

/** Direct SDK EIP-1193 submission. User must still approve in the official wallet.
 * One request ONLY; never auto-fallback after sending because a hash might exist. */
export async function sendThroughSdkProvider(input: {
  from: Address; to: Address; value: bigint; gas: bigint; gasPrice: bigint; data?: Hex;
}): Promise<Hash> {
  const active = sdkSignerFor(input.from);
  if (!active) throw new Error('Social Wallet provider is not matched to the current signer. Reconnect X.');
  const chainRaw = await readProvider(active.provider, 'eth_chainId');
  if (typeof chainRaw !== 'string' || BigInt(chainRaw) !== BigInt(TARGET_CHAIN.id))
    throw new Error('The Social Wallet is not on DogeOS Chikyū Testnet. No signature requested.');
  const accounts = await readProvider(active.provider, 'eth_accounts');
  if (!Array.isArray(accounts) || !accounts.some(a => typeof a === 'string' && a.toLowerCase() === input.from.toLowerCase()))
    throw new Error('Social Wallet does not expose the expected DogeOS address. Reconnect X. No signature requested.');
  // Legacy fee fields for SDK compatibility: do not mix gasPrice with EIP-1559 fee fields.
  const transaction = {
    from: input.from,
    to: input.to,
    value: toHex(input.value),
    gas: toHex(input.gas),
    gasPrice: toHex(input.gasPrice),
    data: input.data ?? '0x',
  };
  // Diagnose the SDK provider itself BEFORE opening a signing popup.
  // Both calls are read-only, timeout safely, and cannot send any DOGE.
  const [price, estimate] = await Promise.all([
    readProvider(active.provider, 'eth_gasPrice'),
    readProvider(active.provider, 'eth_estimateGas', [transaction]),
  ]);
  if (typeof price !== 'string' || !/^0x[0-9a-f]+$/i.test(price) || BigInt(price) <= 0n ||
      typeof estimate !== 'string' || !/^0x[0-9a-f]+$/i.test(estimate) || BigInt(estimate) <= 0n) {
    throw new Error('DogeOS Social Wallet cannot provide a valid network fee. No signing request was sent. Use an external EVM wallet until the provider recovers.');
  }
  // Exactly one submission, with explicit user approval. Never time out / retry signing.
  // Beyond this boundary, errors do not prove that the SDK did not broadcast.
  trace('eth_sendTransaction:requested');
  let response: unknown;
  try {
    response = await active.provider.request({ method: 'eth_sendTransaction', params: [transaction] });
  } catch (error) {
    if (explicitlyRejected(error)) {
      trace('eth_sendTransaction:rejected');
      throw error;
    }
    trace('eth_sendTransaction:unknown');
    throw new UnknownSdkSubmissionError();
  }
  if (typeof response !== 'string' || !isHash(response)) {
    trace('eth_sendTransaction:invalid_response');
    throw new UnknownSdkSubmissionError();
  }
  trace('eth_sendTransaction:hash_received');
  return response;
}
