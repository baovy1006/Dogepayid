import type { Address, Hash } from 'viem';
import { getPublicClient, sendTransaction } from 'wagmi/actions';
import { TARGET_CHAIN } from './config';
import { wagmiConfig } from './wagmi';

function client() {
    const c = getPublicClient(wagmiConfig, { chainId: TARGET_CHAIN.id });
    if (!c) throw new Error('DogeOS RPC is unavailable.');
    return c;
}

/**
 * Estimated network fee (wei) for a native DOGE transfer, with a 20% buffer so the
 * balance check is conservative. Plain value transfer — no approval, no contract call.
 */
export async function estimateSendFee(from: Address, to: Address, value: bigint): Promise<bigint> {
    const c = client();
    const [gas, gasPrice] = await Promise.all([c.estimateGas({ account: from, to, value }), c.getGasPrice()]);
    return (gas * gasPrice * 12n) / 10n;
}

/** Native DOGE transfer signed by the connected wallet on DogeOS Testnet only. */
export const sendDoge = (to: Address, value: bigint): Promise<Hash> =>
    sendTransaction(wagmiConfig, { to, value, chainId: TARGET_CHAIN.id });
