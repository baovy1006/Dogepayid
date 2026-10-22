import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import { CONTRACTS } from '@/lib/config';
import { nameProblem, normalizeName } from '@/lib/dogeId';
import { nameOf, resolveName } from '@/lib/registryService';

const registryLive = !!CONTRACTS.identityRegistry;

/** The Doge ID registered on-chain by a wallet (null = none). */
export function useDogeIdOf(address?: Address) {
    return useQuery({
        queryKey: ['dogeId', 'of', address?.toLowerCase()],
        queryFn: () => nameOf(address as Address),
        enabled: registryLive && !!address,
        staleTime: 30_000,
    });
}

/** Debounced on-chain resolution of a typed Doge ID to its verified owner wallet. */
export function useResolveDogeId(rawInput: string, debounceMs = 350) {
    const [name, setName] = useState(() => normalizeName(rawInput));
    useEffect(() => {
        const id = setTimeout(() => setName(normalizeName(rawInput)), debounceMs);
        return () => clearTimeout(id);
    }, [rawInput, debounceMs]);

    const problem = name ? nameProblem(name) : null;
    const query = useQuery({
        queryKey: ['dogeId', 'resolve', name],
        queryFn: () => resolveName(name),
        enabled: registryLive && !!name && !problem,
        staleTime: 15_000,
    });

    const settled = name === normalizeName(rawInput);
    return {
        name,
        problem,
        owner: query.data ?? null,
        isLoading: !settled || query.isFetching,
        isError: query.isError,
        isResolved: settled && !problem && query.isSuccess,
    };
}
