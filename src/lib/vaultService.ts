import type { Address, Hash } from 'viem';
import { readContract, writeContract } from 'wagmi/actions';
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

function vault(): Address {
    if (!CONTRACTS.savingsVault) throw new Error('Savings contract is not deployed.');
    return CONTRACTS.savingsVault;
}

const write = (functionName: string, args: unknown[], value?: bigint): Promise<Hash> =>
    writeContract(wagmiConfig, { address: vault(), abi: savingsVaultAbi, functionName, args, value, chainId: TARGET_CHAIN.id });

/** All goals of a wallet, read straight from the contract (the source of truth). */
export async function getGoalsOf(owner: Address): Promise<SavingsGoal[]> {
    const [goals, ids] = (await readContract(wagmiConfig, {
        address: vault(),
        abi: savingsVaultAbi,
        functionName: 'getGoalsOf',
        args: [owner],
        chainId: TARGET_CHAIN.id,
    })) as [RawGoal[], bigint[]];
    return goals.map((g, i) => ({ ...g, id: ids[i], createdAt: Number(g.createdAt) * 1000 })).reverse();
}

/** Creates a goal, optionally with a first deposit credited from msg.value. */
export const createGoal = (name: string, target: bigint, initialDeposit: bigint) =>
    initialDeposit > 0n ? write('createGoalAndDeposit', [name, target], initialDeposit) : write('createGoal', [name, target]);

export const depositToGoal = (goalId: bigint, amount: bigint) => write('deposit', [goalId], amount);

export const withdrawFromGoal = (goalId: bigint, amount: bigint) => write('withdraw', [goalId, amount]);

/** Refunds whatever is left to the owner and closes the goal. */
export const closeGoal = (goalId: bigint) => write('closeGoal', [goalId]);
