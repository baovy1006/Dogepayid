import { useCallback, useState } from 'react';
import { useAccount } from 'wagmi';
import { toast } from '@/hooks/use-toast';
import { TARGET_CHAIN } from '@/lib/config';
import { ensureTargetChain, isUserRejection } from '@/lib/wagmi';

/** Connection + network state, with a user-triggered switch to DogeOS Testnet. */
export function useNetworkStatus() {
    const { isConnected, chainId, address } = useAccount();
    const [switching, setSwitching] = useState(false);
    const isWrongNetwork = isConnected && chainId !== TARGET_CHAIN.id;

    const switchToDogeOS = useCallback(async () => {
        setSwitching(true);
        try {
            await ensureTargetChain();
            toast({ title: 'Network ready', description: `Connected to ${TARGET_CHAIN.name}.` });
        } catch (err) {
            toast({
                title: isUserRejection(err) ? 'Network switch cancelled' : 'Could not switch network',
                description: `Select ${TARGET_CHAIN.name} in your wallet to continue.`,
                variant: 'destructive',
            });
        } finally {
            setSwitching(false);
        }
    }, []);

    return { isConnected, address, chainId, isWrongNetwork, switching, switchToDogeOS };
}
