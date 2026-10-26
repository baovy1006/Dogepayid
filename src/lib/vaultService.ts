import { isAddress, type Address, type Hash } from 'viem';
import { readContract, writeContract, getPublicClient } from 'wagmi/actions';
import SavingsVaultArtifact from '@/abi/SavingsVaultABI.json';
import { CONTRACTS, TARGET_CHAIN } from './config';
import { savingsVaultAbi } from './contracts';
import { wagmiConfig } from './wagmi';

export interface SavingsGoal {
    id: bigint;
    owner: Address;
    name: string;
    target: bigint;
    balance: bigint;
    totalDeposited: bigint;
    totalWithdrawn: bigint;
    createdAt: number;
    closed: boolean;
}
type RawGoal = Omit<SavingsGoal, 'id' | 'createdAt'> & { createdAt: bigint };
const KEY = 'dogepay:savingsVault';

export function getVaultAddress(): Address | undefined {
    if (CONTRACTS.savingsVault) return CONTRACTS.savingsVault;
    try {
        const cached = localStorage.getItem(KEY);
        return cached && isAddress(cached) ? cached as Address : undefined;
    } catch { return undefined; }
}
export async function connectVerifiedVault(address: Address): Promise<void> {
    if (!isAddress(address)) throw new Error('Enter a valid DogeOS wallet/contract address.');
    const deployed = await getPublicClient(wagmiConfig,{chainId:TARGET_CHAIN.id})?.getBytecode({address});
    if (!deployed || deployed.toLowerCase() !== SavingsVaultArtifact.deployedBytecode.toLowerCase())
        throw new Error('This address does not contain the expected SavingsVault code on DogeOS Testnet.');
    localStorage.setItem(KEY, address);
}
const vault = (): Address => {
    const addr = getVaultAddress();
    if (!addr) throw new Error('Deploy or connect a verified SavingsVault first.');
    return addr;
};
const write = (functionName: string, args: unknown[], value?: bigint): Promise<Hash> =>
    writeContract(wagmiConfig, {address: vault(), abi: savingsVaultAbi, functionName, args, value, chainId: TARGET_CHAIN.id });

export async function getGoalsOf(owner: Address): Promise<SavingsGoal[]> {
    const [goals, ids] = await readContract(wagmiConfig, {
        address: vault(), abi: savingsVaultAbi, functionName:'getGoalsOf',
        args:[owner], chainId: TARGET_CHAIN.id
    }) as [RawGoal[], bigint[]];
    return goals.map((g, i) => ({...g, id: ids[i], createdAt: Number(g.createdAt) * 1000})).reverse();
}
export const createGoal = (name: string, target: bigint, initialDeposit: bigint) =>
    initialDeposit > 0n ? write('createGoalAndDeposit', [name, target], initialDeposit) : write('createGoal',[name,target]);
export const depositToGoal = (goalId: bigint, amount: bigint) => write('deposit',[goalId],amount);
export const withdrawFromGoal = (goalId: bigint, amount: bigint) => write('withdraw',[goalId,amount]);
export const closeGoal = (goalId: bigint) => write('closeGoal',[goalId]);