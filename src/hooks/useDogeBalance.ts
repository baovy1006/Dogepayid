import { useAccount, useBalance } from 'wagmi';
import { TARGET_CHAIN } from '@/lib/config';

/**
 * Real native DOGE balance from the DogeOS RPC (eth_getBalance).
 * This is the single source of truth — the native-DOGE ERC-20 interface reports the
 * same number, so it is never queried or added on top.
 */
export function useDogeBalance() {
    const { address } = useAccount();
    const query = useBalance({
        address,
        chainId: TARGET_CHAIN.id,
        query: { enabled: !!address, refetchInterval: 15_000 },
    });

    return {
        value: query.data?.value,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        refetch: query.refetch,
    };
}
