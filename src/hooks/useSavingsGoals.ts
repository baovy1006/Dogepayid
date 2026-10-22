import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { CONTRACTS } from '@/lib/config';
import { getGoalsOf } from '@/lib/vaultService';

export const SAVINGS_KEY = ['savings', 'goals'] as const;

/** Connected wallet's savings goals, read from the SavingsVault contract. */
export function useSavingsGoals() {
    const { address } = useAccount();
    return useQuery({
        queryKey: [...SAVINGS_KEY, address?.toLowerCase()],
        queryFn: () => getGoalsOf(address!),
        enabled: !!CONTRACTS.savingsVault && !!address,
        refetchInterval: 30_000,
    });
}
