import { BaseError, ContractFunctionRevertedError, InsufficientFundsError, type Hash, type TransactionReceipt } from 'viem';
import { getBlock, waitForTransactionReceipt } from 'wagmi/actions';
import { upsertActivity, type ActivityRecord } from './activityStore';
import { TARGET_CHAIN } from './config';
import { UnknownSdkSubmissionError } from './sdkSignerBridge';
import { ensureTargetChain, getConnectedAddress, isUserRejection, wagmiConfig } from './wagmi';

export type TxPhase = 'idle' | 'signing' | 'pending' | 'confirmed' | 'failed' | 'rejected' | 'unknown';

export interface TxState {
    phase: TxPhase;
    hash?: Hash;
    error?: string;
}

type TrackMeta = Omit<ActivityRecord, 'hash' | 'status' | 'chainId' | 'timestamp'>;

/** Friendly names for the custom errors defined in IdentityRegistry and SavingsVault. */
const REVERT_MESSAGES: Record<string, string> = {
    InvalidName: 'That name does not meet the Doge ID rules.',
    NameTaken: 'That Doge ID was just taken by someone else.',
    AlreadyRegistered: 'This wallet already has a Doge ID.',
    GoalNotFound: 'That savings goal does not exist.',
    NotGoalOwner: 'Only the goal owner can do this.',
    GoalClosedError: 'This goal is closed.',
    ZeroAmount: 'Enter an amount greater than zero.',
    InvalidTarget: 'Enter a target greater than zero.',
    TooManyGoals: 'You have reached the maximum of 20 goals.',
    InsufficientBalance: 'That is more than this goal holds.',
    TransferFailed: 'The DOGE transfer back to your wallet failed.',
};

/** Turns wallet / RPC / contract errors into plain-English messages. */
export function describeTxError(err: unknown): string {
    if (isUserRejection(err)) return 'You rejected the request in your wallet.';
    if (err instanceof BaseError) {
        const revert = err.walk((e) => e instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null;
        const name = revert?.data?.errorName;
        if (name && REVERT_MESSAGES[name]) return REVERT_MESSAGES[name];
        if (err.walk((e) => e instanceof InsufficientFundsError)) return 'Not enough DOGE to cover the amount plus network fee.';
        return err.shortMessage || 'The transaction could not be completed.';
    }
    return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

/**
 * Runs a write end-to-end: verifies network → asks wallet to sign → records a pending
 * entry under the real hash → waits for the receipt → stores confirmed/failed from the receipt.
 * Status is never set to confirmed without an on-chain receipt with status "success".
 */
export async function runTrackedTx(
    send: () => Promise<Hash>,
    meta: TrackMeta,
    onState: (s: TxState) => void,
): Promise<TransactionReceipt | null> {
    const owner = getConnectedAddress();
    if (!owner) {
        onState({ phase: 'failed', error: 'Connect your wallet first.' });
        return null;
    }
    let hash: Hash | undefined;
    try {
        onState({ phase: 'signing' });
        await ensureTargetChain();
        hash = await send();
        onState({ phase: 'pending', hash });
        upsertActivity(owner, { ...meta, hash, status: 'pending', chainId: TARGET_CHAIN.id, timestamp: Date.now() });

        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId: TARGET_CHAIN.id });
        const block = await getBlock(wagmiConfig, { blockNumber: receipt.blockNumber, chainId: TARGET_CHAIN.id }).catch(() => null);
        const ok = receipt.status === 'success';
        upsertActivity(owner, {
            ...meta,
            hash,
            status: ok ? 'confirmed' : 'failed',
            chainId: TARGET_CHAIN.id,
            timestamp: block ? Number(block.timestamp) * 1000 : Date.now(),
        });
        onState(ok ? { phase: 'confirmed', hash } : { phase: 'failed', hash, error: 'The transaction reverted on-chain.' });
        return receipt;
    } catch (err) {
        if (hash) {
            // Broadcast succeeded but we lost track of it (RPC timeout). It may still confirm,
            // so it stays pending — never marked failed or confirmed without a receipt.
            onState({ phase: 'pending', hash, error: 'Still waiting for confirmation. Check the explorer for the latest status.' });
            return null;
        }
        if (err instanceof UnknownSdkSubmissionError) {
            onState({ phase: 'unknown', error: err.message });
            return null;
        }
        onState({ phase: isUserRejection(err) ? 'rejected' : 'failed', hash, error: describeTxError(err) });
        return null;
    }
}
