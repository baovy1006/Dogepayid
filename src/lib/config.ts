import { defineChain } from 'viem';

export const CHAIN_IDS = {
    testnet: 6281971,
};

export const RPC_URLS = {
    [CHAIN_IDS.testnet]: 'https://rpc.testnet.dogeos.com',
};

export const BLOCK_EXPLORERS = {
    [CHAIN_IDS.testnet]: 'https://blockscout.testnet.dogeos.com/',
};


export const TESTNET_CONFIG = {
    chainId: 6281971,
    name: 'DOGE Testnet',
    ticker: 'DOGE',
    atomicUnit: 'wei',
    decimals: 18,
    rpcUrl: 'https://rpc.testnet.dogeos.com',
    explorerUrl: 'https://blockscout.testnet.dogeos.com/',
};

export const DEFAULT_CHAIN_ID = CHAIN_IDS.testnet;

export const TOKEN_CONFIG = {
    ticker: 'DOGE',
    atomicUnit: 'wei',
    decimals: 18,
};

export type NetworkConfig = typeof TESTNET_CONFIG

export const getNetworkConfig = (): NetworkConfig => {
  return TESTNET_CONFIG
}

/**
 * The single chain this dApp runs on (built from TESTNET_CONFIG), in wagmi/viem format.
 * It is the only chain given to RainbowKit, so wallets are always connected to it, or
 * asked to switch to / add it.
 */
export const TARGET_CHAIN = defineChain({
    id: TESTNET_CONFIG.chainId,
    name: TESTNET_CONFIG.name,
    nativeCurrency: { name: TESTNET_CONFIG.ticker, symbol: TESTNET_CONFIG.ticker, decimals: TESTNET_CONFIG.decimals },
    rpcUrls: { default: { http: [TESTNET_CONFIG.rpcUrl] } },
    blockExplorers: {
        default: { name: 'Explorer', url: TESTNET_CONFIG.explorerUrl.replace(/\/$/, '') },
    },
    testnet: true,
});
