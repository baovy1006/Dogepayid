import { defineChain, isAddress, type Address } from 'viem';

/**
 * DogeOS Chikyū Testnet — the only network this app supports.
 * Source: https://docs.dogeos.com/en/developers/developer-quickstart
 * Mainnet is intentionally NOT configured, so wallets can never sign for it here.
 */
export const CHAIN_IDS = {
    testnet: 6281971,
} as const;

export const TESTNET_CONFIG = {
    chainId: 6281971,
    name: 'DogeOS Chikyū Testnet',
    shortName: 'DogeOS Testnet',
    ticker: 'DOGE',
    atomicUnit: 'wei',
    decimals: 18,
    rpcUrl: 'https://rpc.testnet.dogeos.com/',
    explorerUrl: 'https://dogeos-testnet.l2scan.co',
};

export const RPC_URLS = {
    [CHAIN_IDS.testnet]: TESTNET_CONFIG.rpcUrl,
};

export const BLOCK_EXPLORERS = {
    [CHAIN_IDS.testnet]: TESTNET_CONFIG.explorerUrl,
};

export const DEFAULT_CHAIN_ID = CHAIN_IDS.testnet;

export const TOKEN_CONFIG = {
    ticker: 'DOGE',
    atomicUnit: 'wei',
    decimals: 18,
};

/**
 * ERC-20 interface over native DOGE. It reports the SAME balance as the native
 * balance — never add the two together. Native transfers need no approval.
 * Source: https://docs.dogeos.com/en/developers/native-doge-erc20
 */
export const NATIVE_DOGE_ERC20: Address = '0x530000000000000000000000000000000000d09e';

/** DOGE (in wei) kept aside for gas when a user sends "max". 0.01 DOGE. */
export const GAS_RESERVE_WEI = BigInt('10000000000000000');

const envAddress = (value: unknown): Address | undefined =>
    typeof value === 'string' && isAddress(value) ? (value as Address) : undefined;

/**
 * Deployed contract addresses. Undefined until a real deployment exists —
 * features that depend on them show a "not deployed yet" state instead of faking data.
 */
export const CONTRACTS = {
    identityRegistry: envAddress(import.meta.env.VITE_IDENTITY_REGISTRY_ADDRESS),
    savingsVault: envAddress(import.meta.env.VITE_SAVINGS_VAULT_ADDRESS),
};

export type NetworkConfig = typeof TESTNET_CONFIG;

export const getNetworkConfig = (): NetworkConfig => TESTNET_CONFIG;

const explorerBase = TESTNET_CONFIG.explorerUrl.replace(/\/$/, '');
export const explorerTxUrl = (hash: string) => `${explorerBase}/tx/${hash}`;
export const explorerAddressUrl = (address: string) => `${explorerBase}/address/${address}`;

/** Wallet modal theme values (the library needs raw color strings). Mirrors index.css tokens. */
export const BRAND_COLORS = {
    gold: '#D4AC55',
    obsidian: '#101318',
};

/** The single chain given to wagmi / RainbowKit. */
export const TARGET_CHAIN = defineChain({
    id: TESTNET_CONFIG.chainId,
    name: TESTNET_CONFIG.name,
    nativeCurrency: { name: 'Dogecoin', symbol: TESTNET_CONFIG.ticker, decimals: TESTNET_CONFIG.decimals },
    rpcUrls: { default: { http: [TESTNET_CONFIG.rpcUrl] } },
    blockExplorers: {
        default: { name: 'DogeOS Explorer', url: explorerBase },
    },
    testnet: true,
});
