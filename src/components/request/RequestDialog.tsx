import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { AmountField } from '@/components/send/AmountField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDogeIdOf } from '@/hooks/useDogeId';
import { parseDogeAmount } from '@/lib/amount';
import { buildRequestUrl } from '@/lib/paymentRequest';
import { RequestLink } from './RequestLink';

/** Create a shareable DOGE payment request tied to the user's verified Doge ID. */
export const RequestDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
    const { address } = useAccount();
    const { data: name, isLoading } = useDogeIdOf(address);
    const [amount, setAmount] = useState('');
    const [url, setUrl] = useState<string | null>(null);
    const wei = parseDogeAmount(amount);

    useEffect(() => { if (!open) { setAmount(''); setUrl(null); } }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm rounded-xl border-border bg-popover">
                <DialogHeader>
                    <DialogTitle className="font-display text-3xl font-normal">Request DOGE</DialogTitle>
                    <DialogDescription>Share a link. The payer reviews and approves the payment in their own wallet.</DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Checking your Doge ID…</p>
                ) : !name ? (
                    <p className="flex gap-2 rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                        <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden /> Claim your Doge ID on the Home screen first. Requests are addressed to your verified name.
                    </p>
                ) : url ? (
                    <RequestLink url={url} name={name} amount={amount} onEdit={() => setUrl(null)} />
                ) : (
                    <div className="space-y-4">
                        <AmountField id="request-amount" value={amount} onChange={setAmount} />
                        {amount && !wei && <p className="text-xs text-destructive">Enter a valid amount greater than zero.</p>}
                        <p className="text-xs text-muted-foreground">A request doesn't move any funds. It's only paid when the payer signs a transfer.</p>
                        <Button className="h-12 w-full rounded-full" disabled={!wei} onClick={() => setUrl(buildRequestUrl(name, amount))}>Create request</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
