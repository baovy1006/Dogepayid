import { AlertTriangle, HandCoins, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConnectGate } from '@/components/common/ConnectGate';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { RecipientCard } from '@/components/send/RecipientCard';
import { SendDialog } from '@/components/send/SendDialog';
import { Button } from '@/components/ui/button';
import { useResolveDogeId } from '@/hooks/useDogeId';
import { formatDogeId } from '@/lib/dogeId';
import { parseRequest } from '@/lib/paymentRequest';

/** Opens a shared payment request. Paying still goes through the full review + sign flow. */
const Pay = () => {
    const [params] = useSearchParams();
    const { request, error } = useMemo(() => parseRequest(params), [params]);
    const resolved = useResolveDogeId(request?.name ?? '', 0);
    const [open, setOpen] = useState(false);

    return (
        <>
            <PageHeader title="Payment request" description="Someone asked you for DOGE. Review the details before paying." />
            {error || !request ? (
                <div className="glass-card"><EmptyState icon={AlertTriangle} title="Invalid request" description={error ?? 'This link is incomplete.'} /></div>
            ) : (
                <ConnectGate reason="Connect your wallet to review and pay this request.">
                    <div className="glass-card mx-auto max-w-md space-y-5 p-6">
                        <div className="text-center">
                            <HandCoins className="mx-auto h-6 w-6 text-primary" aria-hidden />
                            <p className="tabular mt-3 font-display text-5xl">{request.amount} DOGE</p>
                            <p className="mt-1 text-sm text-muted-foreground">requested by {formatDogeId(request.name)}</p>
                        </div>
                        {resolved.isLoading ? (
                            <p className="flex justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Verifying Doge ID…</p>
                        ) : resolved.owner ? (
                            <RecipientCard name={request.name} address={resolved.owner} />
                        ) : (
                            <p className="text-center text-sm text-destructive">{formatDogeId(request.name)} is not registered. Do not pay this request.</p>
                        )}
                        <p className="text-xs text-muted-foreground">This request has not been paid. Nothing moves until you review and sign the payment in your wallet.</p>
                        <Button className="h-12 w-full rounded-full" disabled={!resolved.owner} onClick={() => setOpen(true)}>Review and pay</Button>
                    </div>
                    <SendDialog open={open} onOpenChange={setOpen} initialRecipient={request.name} initialAmount={request.amount} />
                </ConnectGate>
            )}
        </>
    );
};

export default Pay;
