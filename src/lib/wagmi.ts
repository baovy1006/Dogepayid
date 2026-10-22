import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import {
    injectedWallet,
    metaMaskWallet,
    trustWallet,
    walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { BaseError, UserRejectedRequestError, numberToHex, type EIP1193Provider } from 'viem';
import { http } from 'wagmi';
import { getAccount, getConnectorClient, switchChain } from 'wagmi/actions';
import { TESTNET_CONFIG, TARGET_CHAIN } from '@/lib/config';

// WalletConnect Cloud project id (https://cloud.reown.com). Needed for mobile / QR
// wallets; browser-extension wallets work without it.
const envProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const projectId = envProjectId || 'YOUR_PROJECT_ID';
if (!envProjectId) {
    console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set: only browser-extension wallets are offered.');
}

// Without a real project id, MetaMask / Trust / WalletConnect fall back to the
// WalletConnect relay (QR / deep link) whenever the extension isn't detected, and
// the relay rejects the connection ("origin not allowed"). Offer only the
// injected browser wallet in that case.
const wallets = envProjectId
    ? [
        { groupName: 'Popular', wallets: [metaMaskWallet, trustWallet, walletConnectWallet] },
        { groupName: 'Other', wallets: [injectedWallet] },
    ]
    : [{ groupName: 'Installed', wallets: [injectedWallet] }];

/**
 * Module-level singleton: use it from React (via <WagmiProvider>) and from plain
 * TS services (via `wagmi/actions`, e.g. `readContract(wagmiConfig, ...)`).
 */
export const wagmiConfig = getDefaultConfig({
    appName: 'DogePay ID',
    projectId,
    chains: [TARGET_CHAIN],
    transports: { [TARGET_CHAIN.id]: http(TESTNET_CONFIG.rpcUrl) },
    wallets,
    ssr: false,
});

declare module 'wagmi' {
    interface Register {
        config: typeof wagmiConfig;
    }
}

/** True when the user dismissed / rejected a wallet prompt. */
export const isUserRejection = (err: unknown): boolean => {
    const e = err as { code?: number | string; name?: string } | undefined;
    if (e?.code === 4001 || e?.code === 'ACTION_REJECTED' || e?.name === 'UserRejectedRequestError') return true;
    return err instanceof BaseError && !!err.walk((x) => x instanceof UserRejectedRequestError);
};

/**
 * Makes sure the connected wallet is on TARGET_CHAIN: switches to it, and adds it
 * to the wallet first (MetaMask, Trust Wallet, ...) if the wallet doesn't know it.
 * Throws if no wallet is connected or the user rejects the prompt.
 */
export async function ensureTargetChain(): Promise<void> {
    const { isConnected, chainId, connector } = getAccount(wagmiConfig);
    if (!isConnected || !connector) throw new Error('Wallet not connected');
    if (chainId === TARGET_CHAIN.id) return;

    try {
        // wagmi switches, and on error 4902 ("unknown chain") adds the chain and retries.
        await switchChain(wagmiConfig, { chainId: TARGET_CHAIN.id });
    } catch (err) {
        if (isUserRejection(err)) throw err;
        // Some wallets (e.g. Trust Wallet) report an unknown chain with a code other
        // than 4902, so wagmi never adds it. Add it explicitly, then switch.
        const provider = (await connector.getProvider()) as EIP1193Provider;
        await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: numberToHex(TARGET_CHAIN.id),
                chainName: TARGET_CHAIN.name,
                nativeCurrency: TARGET_CHAIN.nativeCurrency,
                rpcUrls: [TESTNET_CONFIG.rpcUrl],
                blockExplorerUrls: [TARGET_CHAIN.blockExplorers.default.url],
            }],
        });
        if (getAccount(wagmiConfig).chainId !== TARGET_CHAIN.id) {
            await switchChain(wagmiConfig, { chainId: TARGET_CHAIN.id });
        }
    }
}

/** Address of the wallet connected through RainbowKit, or null. Safe to call anywhere. */
export const getConnectedAddress = (): string | null => {
    const { isConnected, address } = getAccount(wagmiConfig);
    return isConnected && address ? address : null;
};

/**
 * ethers v6 signer for the wallet connected through RainbowKit (MetaMask, Trust,
 * WalletConnect, ...). Ensures TARGET_CHAIN first. Use this for all contract
 * writes — never build a signer from `window.ethereum`.
 */
export async function getEthersSigner(): Promise<JsonRpcSigner> {
    await ensureTargetChain();
    const client = await getConnectorClient(wagmiConfig, { chainId: TARGET_CHAIN.id });
    const provider = new BrowserProvider(client.transport, { chainId: client.chain.id, name: client.chain.name });
    return new JsonRpcSigner(provider, client.account.address);
}
