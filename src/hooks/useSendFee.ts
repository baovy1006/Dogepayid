import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import { estimateSendFee } from '@/lib/sendService';

/** Estimated fee (wei, buffered) for a native DOGE transfer to `to`. Refreshed every 20s. */
export function useSendFee(to?: Address) {
    const { address } = useAccount();
    return useQuery({
        queryKey: ['sendFee', address, to],
        // Value doesn't change the gas of a plain transfer; 0 avoids balance-dependent failures.
        queryFn: () => estimateSendFee(address!, to!, 0n),
        enabled: !!address && !!to,
        refetchInterval: 20_000,
    });
}
