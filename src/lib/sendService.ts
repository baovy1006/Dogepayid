import type { Address, Hash } from 'viem';
import { getAccount, getPublicClient, sendTransaction } from 'wagmi/actions';
import { TARGET_CHAIN } from './config';
import { wagmiConfig } from './wagmi';
import { sdkSignerFor, sendThroughSdkProvider } from './sdkSignerBridge';

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

/**
 * Preflight a native DOGE transaction with the real Chikyu RPC before asking the
 * wallet to sign. Explicit EIP-1559 fee fields + gas limit avoid delegating every
 * fee calculation to the wallet confirmation view, which can hang on fee lookup.
 * No private keys are touched and confirmation still happens in the wallet.
 * A wallet may reject or re-estimate parameters; this is not a substitute for
 * SDK-side fee fixes, and the chain receipt remains the source of truth.
 */
export async function sendDoge(to: Address, value: bigint): Promise<Hash> {
    const connected = getAccount(wagmiConfig);
    if (!connected.isConnected || !connected.address) throw new Error('Connect a DogeOS EVM wallet before sending.');
    if (connected.chainId !== TARGET_CHAIN.id) throw new Error('Switch your wallet to DogeOS Chikyū Testnet before sending.');
    const from = connected.address;
    const c = client();
    // SDK Social Wallet: use its EIP-1193 provider directly, not the Wagmi adapter.
    // MetaMask and other external wallets continue through the already-proven Wagmi path.
    if (sdkSignerFor(from)) {
        const [estimatedGas, gasPrice, balance] = await Promise.all([
            c.estimateGas({ account: from, to, value }),
            c.getGasPrice(),
            c.getBalance({ address: from }),
        ]);
        const gas = (estimatedGas * 120n + 99n) / 100n;
        if (gasPrice <= 0n || value + gas * gasPrice > balance)
            throw new Error('Not enough Testnet DOGE or no network gas price. No transaction submitted.');
        return sendThroughSdkProvider({ from, to, value, gas, gasPrice });
    }
    const [estimatedGas, fees, balance] = await Promise.all([
        c.estimateGas({ account: from, to, value }),
        c.estimateFeesPerGas({ type: 'eip1559' }),
        c.getBalance({ address: from }),
    ]);
    const gas = (estimatedGas * 120n + 99n) / 100n;
    const { maxFeePerGas, maxPriorityFeePerGas } = fees;
    if (maxFeePerGas === undefined || maxPriorityFeePerGas === undefined) {
        throw new Error('DogeOS RPC could not determine network fees. Try again after RPC recovers.');
    }
    if (value + gas * maxFeePerGas > balance) {
        throw new Error('Not enough Testnet DOGE for the amount plus estimated execution fee.');
    }
    return sendTransaction(wagmiConfig, {
        to, value, chainId: TARGET_CHAIN.id,
        gas, maxFeePerGas, maxPriorityFeePerGas,
    });
}
