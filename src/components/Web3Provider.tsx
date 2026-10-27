import '@rainbow-me/rainbowkit/styles.css';
import '@dogeos/dogeos-sdk/style.css';
import { useEffect, useRef, type ReactNode } from 'react';
import { WalletConnectProvider, ChainTypeEnum, type WalletConnectKitConfig } from '@dogeos/dogeos-sdk';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { toast } from '@/hooks/use-toast';
import { BRAND_COLORS, TARGET_CHAIN } from '@/lib/config';
import { ensureTargetChain, isUserRejection, wagmiConfig } from '@/lib/wagmi';
import { SdkSignerObserver } from '@/components/wallet/SdkSignerObserver';

const queryClient = new QueryClient();
const sdkClientId = import.meta.env.VITE_DOGEOS_CLIENT_ID?.trim();
const dogeOSConfig: WalletConnectKitConfig | null = sdkClientId ? {
  clientId: sdkClientId,
  defaultConnectChain: ChainTypeEnum.EVM,
  login: {
    basicLogins: ['externalWallets'],
    socialLogins: [{type: 'x'}, {type: 'google'}],
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: { DEFAULT: BRAND_COLORS.gold },
          background: BRAND_COLORS.obsidian,
          content1: '#1B2026',
        },
      },
    },
  },
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || undefined,
  metadata: {
    name: 'DogePay ID',
    description: 'Social payments on DogeOS Chikyū Testnet',
    url: 'https://dogepay-id-hackathon.vercel.app',
    icons: ['https://dogepay-id-hackathon.vercel.app/favicon.ico'],
  },
  chains: {
    evm: [TARGET_CHAIN],
    dogecoin: [{
      id: 1, name: 'Dogecoin',
      nativeCurrency: {name: 'DOGE', symbol: 'DOGE', decimals: 8},
      rpcUrls: { default: { http: [] as string[] } },
    }],
  },
} : null;

const walletTheme = darkTheme({
  accentColor: BRAND_COLORS.gold,
  accentColorForeground: BRAND_COLORS.obsidian,
  borderRadius: 'large',
  overlayBlur: 'small',
});

const ChainGuard = () => {
  const {isConnected, chainId, connector} = useAccount();
  const lastPrompt = useRef<string | null>(null);
  useEffect(() => {
    if (!isConnected || !chainId || chainId === TARGET_CHAIN.id) {
      lastPrompt.current = null;
      return;
    }
    const key = `${connector?.uid}:${chainId}`;
    if (lastPrompt.current === key) return;
    lastPrompt.current = key;
    ensureTargetChain().catch(err => {
      toast({
        title: `Switch to ${TARGET_CHAIN.name}`,
        description: isUserRejection(err)
          ? `This app only works on ${TARGET_CHAIN.name}.`
          : `Could not switch network automatically. Please select ${TARGET_CHAIN.name} in your wallet.`,
        variant: 'destructive',
      });
    });
  }, [isConnected, chainId, connector]);
  return null;
};

/** SDK mounts inside Wagmi/Query contexts so EVM connections synchronize with Pay. */
export const Web3Provider = ({children}: {children: ReactNode}) => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider initialChain={TARGET_CHAIN} modalSize="compact" theme={walletTheme}>
        {dogeOSConfig ? <WalletConnectProvider config={dogeOSConfig}>
          <SdkSignerObserver /><ChainGuard />{children}
        </WalletConnectProvider> : <><ChainGuard />{children}</>}
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
