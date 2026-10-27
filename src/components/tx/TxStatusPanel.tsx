import { useAccount } from 'wagmi';
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { explorerAddressUrl, explorerTxUrl, TARGET_CHAIN } from '@/lib/config';
import type { TxState } from '@/lib/txService';
import { cn } from '@/lib/utils';

const COPY: Record<Exclude<TxState['phase'], 'idle'>, { title: string; body: string }> = {
    signing: { title: 'Confirm in your wallet', body: 'A wallet confirmation is open. Do not submit the same transaction again while its outcome is unknown.' },
    pending: { title: 'Checking transaction receipt', body: `Waiting for an on-chain receipt on ${TARGET_CHAIN.name}. Do not resend.` },
    confirmed: { title: 'Confirmed on-chain', body: 'A successful transaction receipt was found.' },
    failed: { title: 'Could not submit', body: 'An error occurred before a transaction hash was returned. Check wallet history if you saw a wallet confirmation.' },
    rejected: { title: 'Wallet request rejected', body: 'The wallet explicitly reported that you rejected the request.' },
    unknown: { title: 'Submission status unknown', body: 'The provider was asked to submit but did not return a verified hash. Inspect wallet history before any retry.' },
};

/** A normal page component, never an SDK overlay, modal focus trap or retry mechanism. */
export const TxStatusPanel = ({ state }: { state: TxState }) => {
    const { address } = useAccount();
    if (state.phase === 'idle') return null;
    const busy = state.phase === 'signing' || state.phase === 'pending';
    const uncertain = state.phase === 'unknown';
    const Icon = busy ? Loader2 : state.phase === 'confirmed' ? CheckCircle2 : uncertain ? AlertTriangle : XCircle;
    const historyNeeded = state.phase === 'signing' || uncertain || (state.phase === 'pending' && !!state.error);

    return <div role="status" aria-live="polite" className="flex flex-col items-center py-4 text-center">
        <span className={cn('flex h-14 w-14 items-center justify-center rounded-full border',
            busy && 'border-primary/30 text-primary',
            state.phase === 'confirmed' && 'border-success/30 bg-success/10 text-success',
            (uncertain || state.phase === 'failed' || state.phase === 'rejected') && 'border-destructive/30 text-destructive')}>
            <Icon className={cn('h-6 w-6', busy && 'animate-spin')} aria-hidden />
        </span>
        <p className="mt-3 font-display text-2xl">{COPY[state.phase].title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{state.error ?? COPY[state.phase].body}</p>
        {state.hash && <a href={explorerTxUrl(state.hash)} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-xs hover:text-primary">
            {state.hash.slice(0, 10)}…{state.hash.slice(-8)} <ExternalLink className="h-3 w-3" aria-hidden />
        </a>}
        {historyNeeded && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {address && <a href={explorerAddressUrl(address)} target="_blank" rel="noopener noreferrer"
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:border-primary">Check wallet history</a>}
            <button type="button" onClick={() => window.location.reload()}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:border-primary">Reload page</button>
            <p className="w-full text-xs text-muted-foreground">Reloading does not cancel, approve or repeat a blockchain transaction.</p>
        </div>}
    </div>;
};
