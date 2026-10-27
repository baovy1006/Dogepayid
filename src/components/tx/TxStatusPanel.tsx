import { CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { explorerTxUrl, TARGET_CHAIN } from '@/lib/config';
import type { TxState } from '@/lib/txService';
import { cn } from '@/lib/utils';

const COPY: Record<Exclude<TxState['phase'], 'idle'>, { title: string; body: string }> = {
    signing: { title: 'Confirm in your wallet', body: 'Review recipient, amount and fee in your wallet. If network fee keeps spinning, do not resubmit: cancel the wallet prompt first and check transaction history before retrying.' },
    pending: { title: 'Waiting for confirmation', body: `Submitted to ${TARGET_CHAIN.name}. This usually takes a few seconds.` },
    confirmed: { title: 'Confirmed on-chain', body: 'The network has confirmed this transaction.' },
    failed: { title: 'Transaction failed', body: 'Nothing was confirmed. No DOGE moved unless the explorer says otherwise.' },
    rejected: { title: 'Request rejected', body: 'You declined in your wallet. Nothing was sent.' },
};

/** Live state of a transaction: signing → pending → confirmed/failed, with the real hash. */
export const TxStatusPanel = ({ state }: { state: TxState }) => {
    if (state.phase === 'idle') return null;
    const copy = COPY[state.phase];
    const busy = state.phase === 'signing' || state.phase === 'pending';
    const Icon = busy ? Loader2 : state.phase === 'confirmed' ? CheckCircle2 : XCircle;

    return (
        <div role="status" aria-live="polite" className="flex flex-col items-center py-4 text-center">
            <span className={cn('flex h-14 w-14 items-center justify-center rounded-full border',
                busy && 'border-primary/30 text-primary',
                state.phase === 'confirmed' && 'border-success/30 bg-success/10 text-success',
                (state.phase === 'failed' || state.phase === 'rejected') && 'border-destructive/30 bg-destructive/10 text-destructive')}>
                <Icon className={cn('h-6 w-6', busy && 'animate-spin')} aria-hidden />
            </span>
            <p className="mt-4 font-display text-2xl">{copy.title}</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{state.error ?? copy.body}</p>
            {state.hash && (
                <a href={explorerTxUrl(state.hash)} target="_blank" rel="noreferrer"
                    className="interactive mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground hover:border-primary/40 hover:text-primary">
                    {state.hash.slice(0, 10)}…{state.hash.slice(-8)} <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
            )}
        </div>
    );
};
