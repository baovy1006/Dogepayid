import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TARGET_CHAIN } from '@/lib/config';
import { formatDoge } from '@/lib/format';
import { RecipientCard } from './RecipientCard';

interface Props {
    name: string;
    owner: string;
    wei: bigint;
    fee: bigint;
    error?: string | null;
    onBack: () => void;
    onConfirm: () => void;
}

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className="flex justify-between gap-4 py-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={strong ? 'tabular font-semibold' : 'tabular'}>{value}</span>
    </div>
);

/** Step 3 — explicit review. Nothing is signed until the user presses Confirm. */
export const ReviewStep = ({ name, owner, wei, fee, error, onBack, onConfirm }: Props) => (
    <div className="space-y-4">
        <RecipientCard name={name} address={owner} />
        <div className="divide-y divide-border rounded-lg border border-border px-4">
            <Row label="Amount" value={`${formatDoge(wei, 18)} DOGE`} strong />
            <Row label="Network fee (est.)" value={`~${formatDoge(fee, 6)} DOGE`} />
            <Row label="Total (max)" value={`${formatDoge(wei + fee, 6)} DOGE`} />
            <Row label="Network" value={TARGET_CHAIN.name} />
        </div>
        <p className="flex gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Blockchain payments can't be reversed. The Doge ID is re-checked on-chain right before you sign.
        </p>
        {error && <p className="text-xs text-destructive" aria-live="polite">{error}</p>}
        <div className="flex gap-3">
            <Button variant="secondary" className="h-12 flex-1 rounded-full" onClick={onBack}>Back</Button>
            <Button className="h-12 flex-[2] rounded-full" onClick={onConfirm}>Confirm and sign</Button>
        </div>
    </div>
);
