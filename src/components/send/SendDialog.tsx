import { useEffect, useState } from 'react';
import type { Address } from 'viem';
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
import { RecipientStep } from './RecipientStep';
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
    const fee = useSendFee(to?.owner);
    const balance = useDogeBalance();
    const wei = parseDogeAmount(amount);
    // A pending tx with an error means we lost track of it (RPC timeout) — let the user close.
    const busy = tx.phase === 'signing' || (tx.phase === 'pending' && !tx.error);

    useEffect(() => {
        if (open) { setInput(initialRecipient); setAmount(initialAmount); setStep('recipient'); setTo(null); setTx({ phase: 'idle' }); setReviewError(null); }
    }, [open, initialRecipient, initialAmount]);

    const confirm = async () => {
        if (!to || !wei) return;
        setReviewError(null);
        // Re-resolve right before signing so a stale lookup can never redirect funds.
        const fresh = await resolveName(to.name).catch(() => null);
        if (!fresh || fresh.toLowerCase() !== to.owner.toLowerCase()) return setReviewError('This Doge ID no longer resolves to the address shown. Payment stopped.');
        const latest = (await balance.refetch()).data?.value;
        if (latest !== undefined && fee.data !== undefined && wei + fee.data > latest) return setReviewError('Your balance changed and no longer covers this payment plus fee.');
        setStep('tx');
        const receipt = await runTrackedTx(() => sendDoge(to.owner, wei), { kind: 'send', amountWei: wei.toString(), counterparty: { address: to.owner, dogeId: formatDogeId(to.name) } }, setTx);
        if (receipt) balance.refetch();
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
            <DialogContent className="max-w-md rounded-xl border-border bg-popover">
                <DialogHeader>
                    <DialogTitle className="font-display text-3xl font-normal">{step === 'review' ? 'Review payment' : 'Send DOGE'}</DialogTitle>
                    <DialogDescription>{step === 'tx' ? 'Payment status' : 'Pay a person by their Doge ID.'}</DialogDescription>
                </DialogHeader>
                {step === 'recipient' && <RecipientStep input={input} onInput={setInput} onNext={(name, owner) => { setTo({ name, owner }); setStep('amount'); }} />}
                {step === 'amount' && to && <AmountStep {...to} amount={amount} onAmount={setAmount} fee={fee.data} feeLoading={fee.isLoading} onBack={() => setStep('recipient')} onNext={() => setStep('review')} />}
                {step === 'review' && to && wei && fee.data !== undefined && <ReviewStep {...to} wei={wei} fee={fee.data} error={reviewError} onBack={() => setStep('amount')} onConfirm={confirm} />}
                {step === 'tx' && (
                    <>
                        <TxStatusPanel state={tx} />
                        {tx.phase === 'confirmed' && to && wei && <p className="text-center text-sm">Sent <span className="tabular font-semibold">{formatDoge(wei, 18)} DOGE</span> to {formatDogeId(to.name)}</p>}
                        {!busy && (
                            <Button variant="secondary" className="w-full rounded-full" onClick={() => (tx.phase === 'confirmed' || tx.phase === 'pending' ? onOpenChange(false) : setStep('review'))}>
                                {tx.phase === 'confirmed' ? 'Done' : tx.phase === 'pending' ? 'Close' : 'Back to review'}
                            </Button>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
