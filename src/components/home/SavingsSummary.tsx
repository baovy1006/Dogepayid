import { PiggyBank } from 'lucide-react';
import { StatusPill } from '@/components/common/StatusPill';
import { CONTRACTS } from '@/lib/config';

/** Savings goals summary. No goals are shown until real contract data exists. */
export const SavingsSummary = () => {
    const vaultLive = !!CONTRACTS.savingsVault;

    return (
        <section className="glass-card p-6" aria-labelledby="savings-title">
            <div className="flex items-center justify-between">
                <h2 id="savings-title" className="flex items-center gap-2 text-sm font-medium">
                    <PiggyBank className="h-4 w-4 text-primary" aria-hidden /> Savings goals
                </h2>
                <StatusPill tone="muted">{vaultLive ? 'No goals yet' : 'Coming soon'}</StatusPill>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
                <div className="h-full w-0 rounded-full bg-primary" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
                {vaultLive
                    ? 'Create a goal and deposit DOGE. Withdraw anytime.'
                    : 'Goals open once the savings contract is live. No yield, no lockups — withdraw your DOGE anytime.'}
            </p>
        </section>
    );
};
