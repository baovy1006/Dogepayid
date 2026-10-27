import { useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { createPortal, flushSync } from 'react-dom';
import { TxStatusPanel } from '@/components/tx/TxStatusPanel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useResolveDogeId } from '@/hooks/useDogeId';
import { formatDogeId } from '@/lib/dogeId';
import { registerName } from '@/lib/registryService';
import { runTrackedTx, type TxState } from '@/lib/txService';
import { NameAvailability } from './NameAvailability';

/** Claim a Doge ID. The wallet signs `register(name)`; the contract binds it to msg.sender. */
export const RegisterIdDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
    const { address } = useAccount();
    const qc = useQueryClient();
    const [input, setInput] = useState('');
    const [tx, setTx] = useState<TxState>({ phase: 'idle' });
    const submitting = useRef(false);
    const { name, problem, owner, isLoading, isError, isResolved } = useResolveDogeId(input);
    const canSubmit = isResolved && !owner && tx.phase === 'idle';

    const submit = async () => {
        if (!canSubmit || !address || submitting.current) return;
        submitting.current = true;
        console.info('[dogepay:wallet]', 'ui:register_clicked');
        flushSync(() => setTx({ phase: 'signing' }));
        try {
            const receipt = await runTrackedTx(() => registerName(name), { kind: 'register_id', label: formatDogeId(name) }, setTx);
            if (receipt?.status === 'success') void qc.invalidateQueries({ queryKey: ['dogeId'] });
        } finally {
            submitting.current = false;
        }
    };

    const close = (o: boolean) => {
        if (!o && (tx.phase === 'signing' || tx.phase === 'pending')) return;
        onOpenChange(o);
        if (!o) { setInput(''); setTx({ phase: 'idle' }); }
    };

    return (
        <>
        <Dialog open={open && tx.phase === 'idle'} onOpenChange={close}>
            <DialogContent className="max-w-md rounded-xl border-border bg-popover">
                <DialogHeader>
                    <DialogTitle className="font-display text-3xl font-normal">Claim your Doge ID</DialogTitle>
                    <DialogDescription>Friends can pay you by name instead of copying your address.</DialogDescription>
                </DialogHeader>
                {tx.phase === 'idle' ? (
                    <div className="space-y-4">
                        <label htmlFor="dogeid-input" className="sr-only">Doge ID</label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                            <Input id="dogeid-input" autoFocus autoComplete="off" spellCheck={false} maxLength={30} value={input}
                                onChange={(e) => setInput(e.target.value)} placeholder="yourname"
                                className="h-12 rounded-full bg-background/60 pl-8 pr-16 font-mono" />
                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">.doge</span>
                        </div>
                        <NameAvailability name={name} problem={problem} isLoading={isLoading} taken={!!owner} isError={isError} />
                        <p className="flex gap-2 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                            <Lock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                            One name per wallet, permanent. It cannot be changed or transferred in this version. Registered to {address?.slice(0, 6)}…{address?.slice(-4)}.
                        </p>
                        <p className="text-xs text-muted-foreground">Registration is an on-chain transaction and requires a network fee. Your wallet will ask for confirmation once the contract and fee checks complete.</p>
                        <Button onClick={() => void submit()} disabled={!canSubmit} className="h-12 w-full rounded-full">Register {name && !problem ? formatDogeId(name) : ''}</Button>
                    </div>
                ) : null}            </DialogContent>
        </Dialog>
        {open && tx.phase !== 'idle' && typeof document !== 'undefined' && createPortal(
            <section role="region" aria-label="Doge ID registration status"
                className="pointer-events-none fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md">
                <div className="pointer-events-auto max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-popover p-5 shadow-2xl">
                    <p className="text-sm font-semibold">Claim {name ? formatDogeId(name) : 'Doge ID'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">On-chain registration · {address?.slice(0, 6)}…{address?.slice(-4)}</p>
                    <TxStatusPanel state={tx} />
                    {tx.phase === 'confirmed' && <Button variant="secondary" className="w-full" onClick={() => close(false)}>Done</Button>}
                    {(tx.phase === 'failed' || tx.phase === 'rejected') &&
                        <Button variant="secondary" className="w-full" onClick={() => setTx({ phase: 'idle' })}>Back to registration</Button>}
                    {tx.phase === 'pending' && tx.error &&
                        <Button variant="secondary" className="w-full" onClick={() => close(false)}>Close status</Button>}
                    {tx.phase === 'unknown' && <p className="mt-2 text-center text-xs text-muted-foreground">
                        Do not register again until you have verified your wallet history.
                    </p>}
                </div>
            </section>, document.body
        )}
        </>
    );
};
