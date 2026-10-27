import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from 'wagmi';
import { CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { explorerAddressUrl, explorerTxUrl, TARGET_CHAIN } from '@/lib/config';
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
    const { address } = useAccount();
    const [walletUnresponsive, setWalletUnresponsive] = useState(false);
    useEffect(() => {
        setWalletUnresponsive(false);
        if (state.phase !== 'signing') return;
        // A stuck SDK signing request must never lock the entire app indefinitely.
        // This timer only reveals an escape hatch; it never cancels, retries, or sends.
        const timer = window.setTimeout(() => setWalletUnresponsive(true), 18000);
        return () => window.clearTimeout(timer);
    }, [state.phase]);
    if (state.phase === 'idle') return null;
    const copy = COPY[state.phase];
    const busy = state.phase === 'signing' || state.phase === 'pending';
    const Icon = busy ? Loader2 : state.phase === 'confirmed' ? CheckCircle2 : XCircle;

    return (
        <>
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
        {walletUnresponsive && state.phase === 'signing' && typeof document !== 'undefined' && createPortal(
            <div
                role="alert"
                aria-live="assertive"
                aria-label="Wallet recovery options"
                style={{position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 2147483647, pointerEvents: 'none'}}
            >
                <div
                    className="mx-auto max-w-md rounded-xl border border-amber-400/50 bg-[#151b23] p-4 text-[#f5f5f0] shadow-2xl"
                    style={{pointerEvents: 'auto'}}
                >
                    <p className="text-sm font-semibold">Wallet confirmation is not responding</p>
                    <p className="mt-1 text-xs leading-5 text-[#b9c4ca]">
                        If the fee is blank or the wallet buttons are frozen, do not approve or retry.
                        Reloading restores the page, but does not cancel a transaction already broadcast.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                        {address && <a href={explorerAddressUrl(address)} target="_blank" rel="noopener noreferrer"
                            className="rounded-lg border border-[#5c6871] px-3 py-2 text-xs font-medium text-[#f5f5f0] hover:bg-[#29333c]">
                            Check wallet history
                        </a>}
                        <button type="button" onClick={() => window.location.reload()}
                            className="rounded-lg bg-[#d4ac55] px-3 py-2 text-xs font-semibold text-[#111318] hover:bg-[#e3be6c]">
                            Recover page
                        </button>
                    </div>
                </div>
            </div>, document.body,
        )}
        </>
    );
};
