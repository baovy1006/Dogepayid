import { zeroAddress, type Address, type Hash } from 'viem';
import { readContract, writeContract } from 'wagmi/actions';
import { CONTRACTS, TARGET_CHAIN } from './config';
import { identityRegistryAbi } from './contracts';
import { isValidName } from './dogeId';
import { wagmiConfig } from './wagmi';

/** IdentityRegistry reads/writes. Names passed here must already be normalized. */
function registry(): Address {
    if (!CONTRACTS.identityRegistry) throw new Error('Doge ID registry is not deployed.');
    return CONTRACTS.identityRegistry;
}

const read = <T>(functionName: string, args: unknown[]) =>
    readContract(wagmiConfig, { address: registry(), abi: identityRegistryAbi, functionName, args, chainId: TARGET_CHAIN.id }) as Promise<T>;

/** Owner wallet of a Doge ID, or null when unregistered. */
export async function resolveName(name: string): Promise<Address | null> {
    if (!isValidName(name)) return null;
    const owner = await read<Address>('resolve', [name]);
    return owner && owner !== zeroAddress ? owner : null;
}

/** Doge ID registered by a wallet, or null. */
export async function nameOf(owner: Address): Promise<string | null> {
    const name = await read<string>('nameOf', [owner]);
    return name || null;
}

export const isNameAvailable = (name: string) => read<boolean>('isAvailable', [name]);

/** Self-registration: the contract binds the name to msg.sender only. */
export function registerName(name: string): Promise<Hash> {
    return writeContract(wagmiConfig, {
        address: registry(),
        abi: identityRegistryAbi,
        functionName: 'register',
        args: [name],
        chainId: TARGET_CHAIN.id,
    });
}
