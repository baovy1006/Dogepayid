import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { toast } from '@/hooks/use-toast';
import { shortenAddress } from '@/lib/format';

/** Notifies the user when they switch accounts inside their wallet. */
export const WalletEvents = () => {
    const { address } = useAccount();
    const previous = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (previous.current && address && previous.current !== address) {
            toast({ title: 'Wallet account changed', description: `Now using ${shortenAddress(address)}.` });
        }
        previous.current = address;
    }, [address]);

    return null;
};
