import { useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';
import { createPortal, flushSync } from 'react-dom';
import { TxStatusPanel } from '@/components/tx/TxStatusPanel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDogeBalance } from '@/hooks/useDogeBalance';
import { useSendFee } from '@/hooks/useSendFee';
import { parseDogeAmount } from '@/lib/amount';
import { formatDogeId } from '@/lib/dogeId';
import { formatDoge } from '@/lib/format';
import { resolveName } from '@/lib/registryService';
import { sendDoge } from '@/lib/sendService';
import { runTrackedTx, type TxState } from '@/lib/txService';
import { AmountStep } from './AmountStep';
import { RecipientWithFriends } from './RecipientWithFriends';
import { ReviewStep } from './ReviewStep';

type Step = 'recipient' | 'amount' | 'review' | 'tx';

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    initialRecipient?: string;
    initialAmount?: string;
}

/** Connect → Doge ID → resolve → amount → review → sign → confirm. Never auto-submits. */
export const SendDialog = ({ open, onOpenChange, initialRecipient = '', initialAmount = '' }: Props) => {
    const [step, setStep] = useState<Step>('recipient');
    const [input, setInput] = useState(initialRecipient);
    const [amount, setAmount] = useState(initialAmount);
    const [to, setTo] = useState<{ name: string; owner: Address } | null>(null);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [tx, setTx] = useState<TxState>({ phase: 'idle' });
    const submissionInProgress = useRef(false);
    const fee = useSendFee(to?.owner);
    const balance = useDogeBalance();
    const wei = parseDogeAmount(amount);
    // A pending tx with an error means we lost track of it (RPC timeout) — let the user close.
    const busy = tx.phase === 'signing' || (tx.phase === 'pending' && !tx.error);

    useEffect(() => {
        if (open) { setInput(initialRecipient); setAmount(initialAmount); setStep('recipient'); setTo(null); setTx({ phase: 'idle' }); setReviewError(null); }
    }, [open, initialRecipient, initialAmount]);

    const confirm = async () => {
        if (!to || !wei || submissionInProgress.current) return;
        console.info('[dogepay:wallet]', 'ui:send_clicked');
        submissionInProgress.current = true;
        setReviewError(null);
        try {
            // Re-resolve right before signing so a stale lookup can never redirect funds.
            const fresh = to.name ? await resolveName(to.name).catch(() => null) : to.owner;
            if (!fresh || fresh.toLowerCase() !== to.owner.toLowerCase()) {
                setReviewError('This Doge ID no longer resolves to the address shown. Payment stopped.');
                return;
            }
            const latest = (await balance.refetch()).data?.value;
            if (latest !== undefined && fee.data !== undefined && wei + fee.data > latest) {
                setReviewError('Your balance changed and no longer covers this payment plus fee.');
                return;
            }
            // Remove app dialog's focus trap before asking the SDK to sign.
            flushSync(() => setStep('tx'));
            const receipt = await runTrackedTx(() => sendDoge(to.owner, wei), { kind: 'send', amountWei: wei.toString(), counterparty: { address: to.owner, dogeId: to.name ? formatDogeId(to.name) : undefined } }, setTx);
            if (receipt) void balance.refetch();
        } catch (error) {
            setReviewError(error instanceof Error ? error.message : 'Could not prepare the payment.');
        } finally {
            submissionInProgress.current = false;
        }
    };

    return (
        <>
        <Dialog open={open && step !== 'tx'} onOpenChange={(o) => step !== 'tx' && !busy && onOpenChange(o)}>
            <DialogContent className="max-w-md rounded-xl border-border bg-popover">
                <DialogHeader>
                    <DialogTitle className="font-display text-3xl font-normal">{step === 'review' ? 'Review payment' : 'Send DOGE'}</DialogTitle>
                    <DialogDescription>{step === 'tx' ? 'Payment status' : 'Pay a person by their Doge ID.'}</DialogDescription>
                </DialogHeader>
                {step === 'recipient' && <RecipientWithFriends input={input} onInput={setInput} onNext={(name, owner) => { setTo({ name, owner }); setStep('amount'); }} />}
                {step === 'amount' && to && <AmountStep {...to} amount={amount} onAmount={setAmount} fee={fee.data} feeLoading={fee.isLoading} onBack={() => setStep('recipient')} onNext={() => setStep('review')} />}
                {step === 'review' && to && !!wei && fee.data !== undefined && <ReviewStep {...to} wei={wei} fee={fee.data} error={reviewError} onBack={() => setStep('amount')} onConfirm={confirm} />}
            </DialogContent>
        </Dialog>
        {open && step === 'tx' && typeof document !== 'undefined' && createPortal(
            <section role="region" aria-label="Payment transaction status"
                className="pointer-events-none fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md">
                <div className="pointer-events-auto max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-popover p-5 shadow-2xl">
                    <p className="text-sm font-semibold">Send DOGE</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {to?.name ? formatDogeId(to.name) : to?.owner} · {wei ? formatDoge(wei, 18) : '—'} DOGE
                    </p>
                    <TxStatusPanel state={tx} />
                    {tx.phase === 'confirmed' && <Button variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>Done</Button>}
                    {(tx.phase === 'failed' || tx.phase === 'rejected') &&
                        <Button variant="secondary" className="w-full" onClick={() => setStep('review')}>Back to review</Button>}
                    {tx.phase === 'pending' && tx.error &&
                        <Button variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>Close status</Button>}
                    {tx.phase === 'unknown' && <p className="mt-2 text-center text-xs text-muted-foreground">
                        Submission remains locked. Check history before starting another payment.
                    </p>}
                </div>
            </section>, document.body
        )}
        </>
    );
};
