import '@rainbow-me/rainbowkit/styles.css';
import { useEffect, useRef, type ReactNode } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { toast } from '@/hooks/use-toast';
import { BRAND_COLORS, TARGET_CHAIN } from '@/lib/config';
import { ensureTargetChain, isUserRejection, wagmiConfig } from '@/lib/wagmi';

const queryClient = new QueryClient();

const walletTheme = darkTheme({
    accentColor: BRAND_COLORS.gold,
    accentColorForeground: BRAND_COLORS.obsidian,
    borderRadius: 'large',
    overlayBlur: 'small',
});

/**
 * Keeps the connected wallet on TARGET_CHAIN. Whenever a wallet is connected on
 * another chain (on connect, on page load, or after the user switches in the
 * wallet), it prompts once to switch to / add TARGET_CHAIN. If the user rejects, RainbowKit's
 * button shows "Wrong network" and the SDK re-prompts before any transaction.
 */
const ChainGuard = () => {
    const { isConnected, chainId, connector } = useAccount();
    const lastPrompt = useRef<string | null>(null);

    useEffect(() => {
        if (!isConnected || !chainId || chainId === TARGET_CHAIN.id) {
            lastPrompt.current = null;
            return;
        }
        const key = `${connector?.uid}:${chainId}`;
        if (lastPrompt.current === key) return; // don't re-prompt in a loop after a rejection
        lastPrompt.current = key;

        ensureTargetChain().catch((err) => {
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

export const Web3Provider = ({ children }: { children: ReactNode }) => (
    <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
            <RainbowKitProvider initialChain={TARGET_CHAIN} modalSize="compact" theme={walletTheme}>
                <ChainGuard />
                {children}
            </RainbowKitProvider>
        </QueryClientProvider>
    </WagmiProvider>
);
