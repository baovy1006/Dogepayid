import { AtSign } from 'lucide-react';
import { StatusPill } from '@/components/common/StatusPill';
import { CONTRACTS } from '@/lib/config';

/** Doge ID status. Shows a not-deployed state until the on-chain registry exists. */
export const DogeIdCard = () => {
    const registryLive = !!CONTRACTS.identityRegistry;

    return (
        <section className="glass-card p-6" aria-labelledby="dogeid-title">
            <div className="flex items-center justify-between">
                <h2 id="dogeid-title" className="flex items-center gap-2 text-sm font-medium">
                    <AtSign className="h-4 w-4 text-primary" aria-hidden /> Doge ID
                </h2>
                <StatusPill tone="muted">Not registered</StatusPill>
            </div>
            <p className="mt-5 font-display text-3xl text-muted-foreground/70">@yourname.doge</p>
            <p className="mt-2 text-sm text-muted-foreground">
                {registryLive
                    ? 'Claim your name so friends can pay you without copying an address.'
                    : 'Registration opens once the Identity Registry contract is live on DogeOS Testnet.'}
            </p>
        </section>
    );
};
