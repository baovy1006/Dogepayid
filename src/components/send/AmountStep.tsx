import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { useDogeBalance } from '@/hooks/useDogeBalance';
import { parseDogeAmount } from '@/lib/amount';
import { formatDoge } from '@/lib/format';
import { AmountField } from './AmountField';
import { RecipientCard } from './RecipientCard';

interface Props {
    name: string;
    owner: string;
    amount: string;
    onAmount: (v: string) => void;
    fee?: bigint;
    feeLoading: boolean;
    onBack: () => void;
    onNext: () => void;
}

/** Step 2 — enter an amount, checked against balance including the network fee. */
export const AmountStep = ({ name, owner, amount, onAmount, fee, feeLoading, onBack, onNext }: Props) => {
    const { value: balance } = useDogeBalance();
    const wei = parseDogeAmount(amount);
    const insufficient = wei !== null && balance !== undefined && fee !== undefined && wei + fee > balance;
    const maxSendable = balance !== undefined && fee !== undefined && balance > fee ? balance - fee : 0n;

    let error: string | null = null;
    if (amount && wei === null) error = 'Enter a valid amount (up to 18 decimals).';
    else if (insufficient) error = 'Not enough DOGE for this amount plus the network fee.';

    return (
        <div className="space-y-4">
            <RecipientCard name={name} address={owner} compact />
            <AmountField id="send-amount" value={amount} onChange={onAmount} onMax={() => onAmount(formatUnits(maxSendable, 18))} />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Available: <span className="tabular text-foreground">{balance !== undefined ? formatDoge(balance) : '—'} DOGE</span></span>
                <span>Fee: {feeLoading ? '…' : fee !== undefined ? `~${formatDoge(fee, 6)} DOGE` : 'unavailable'}</span>
            </div>
            {error && <p className="text-xs text-destructive" aria-live="polite">{error}</p>}
            <div className="flex gap-3">
                <Button variant="secondary" className="h-12 flex-1 rounded-full" onClick={onBack}>Back</Button>
                <Button className="h-12 flex-[2] rounded-full" disabled={!wei || !!error || fee === undefined} onClick={onNext}>Review</Button>
            </div>
        </div>
    );
};
