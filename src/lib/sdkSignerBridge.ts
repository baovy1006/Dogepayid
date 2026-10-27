import { isHash, toHex, type Address, type Hash, type Hex } from 'viem';
import { TARGET_CHAIN } from './config';

/** Only the SDK EVM provider bound to the *same* Wagmi address is eligible. */
export interface EvmSdkProvider {
  request(args: { method: string; params?: readonly unknown[] | object }): Promise<unknown>;
}
type Session = { address: Address; provider: EvmSdkProvider };
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
  const chainRaw = await withReadDeadline(active.provider.request({ method: 'eth_chainId' }), 'eth_chainId');
  if (typeof chainRaw !== 'string' || BigInt(chainRaw) !== BigInt(TARGET_CHAIN.id))
    throw new Error('The Social Wallet is not on DogeOS Chikyū Testnet. No signature requested.');
  const accounts = await withReadDeadline(active.provider.request({ method: 'eth_accounts' }), 'eth_accounts');
  if (!Array.isArray(accounts) || !accounts.some(a => typeof a === 'string' && a.toLowerCase() === input.from.toLowerCase()))
    throw new Error('Social Wallet does not expose the expected DogeOS address. Reconnect X. No signature requested.');
  // Legacy fee fields for SDK compatibility: do not mix gasPrice with EIP-1559 fee fields.
  const response = await active.provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from: input.from,
      to: input.to,
      value: toHex(input.value),
      gas: toHex(input.gas),
      gasPrice: toHex(input.gasPrice),
      data: input.data ?? '0x',
    }],
  });
  if (typeof response !== 'string' || !isHash(response))
    throw new Error('Social Wallet did not return a valid transaction hash. Inspect wallet activity before trying again.');
  return response;
}
