import { AtSign, BadgeCheck, Copy } from 'lucide-react';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { StatusPill } from '@/components/common/StatusPill';
import { RegisterIdDialog } from '@/components/dogeid/RegisterIdDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDogeIdOf } from '@/hooks/useDogeId';
import { copyToClipboard } from '@/lib/clipboard';
import { CONTRACTS } from '@/lib/config';
import { formatDogeId } from '@/lib/dogeId';
import { shortenAddress } from '@/lib/format';

/** The connected wallet's Doge ID, read from the on-chain registry. */
export const DogeIdCard = () => {
    const { address } = useAccount();
    const { data: name, isLoading, isError, refetch } = useDogeIdOf(address);
    const [open, setOpen] = useState(false);
    const registryLive = !!CONTRACTS.identityRegistry;

    return (
        <section className="glass-card p-6" aria-labelledby="dogeid-title">
            <div className="flex items-center justify-between">
                <h2 id="dogeid-title" className="flex items-center gap-2 text-sm font-medium">
                    <AtSign className="h-4 w-4 text-primary" aria-hidden /> Doge ID
                </h2>
                {name ? <StatusPill tone="success">Verified on-chain</StatusPill> : <StatusPill tone="muted">{isLoading ? 'Checking…' : 'Not registered'}</StatusPill>}
            </div>
            {isLoading ? (
                <Skeleton className="mt-5 h-9 w-48" />
            ) : name ? (
                <>
                    <button onClick={() => copyToClipboard(formatDogeId(name), 'Doge ID copied')} className="interactive mt-5 flex items-center gap-2 text-left font-display text-3xl hover:text-primary" aria-label="Copy Doge ID">
                        {formatDogeId(name)} <Copy className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </button>
                    <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                        <BadgeCheck className="h-3.5 w-3.5 text-success" aria-hidden /> Owned by {shortenAddress(address ?? '')}
                    </p>
                </>
            ) : isError ? (
                <div className="mt-5 text-sm text-muted-foreground">Could not read the registry. <button className="text-primary underline" onClick={() => refetch()}>Retry</button></div>
            ) : (
                <>
                    <p className="mt-5 font-display text-3xl text-muted-foreground/70">@yourname.doge</p>
                    <p className="mt-2 text-sm text-muted-foreground">Claim a name so friends can pay you without copying an address.</p>
                    <Button onClick={() => setOpen(true)} disabled={!registryLive} className="mt-4 rounded-full">Claim your Doge ID</Button>
                </>
            )}
            <RegisterIdDialog open={open} onOpenChange={setOpen} />
        </section>
    );
};
