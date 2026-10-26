import { QRCodeSVG } from 'qrcode.react';
import { Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard';
import { formatDogeId } from '@/lib/dogeId';

/** Generated request: QR + link + copy/share. Explicitly states it is unpaid. */
export const RequestLink = ({ url, name, amount, onEdit }: { url: string; name: string; amount: string; onEdit: () => void }) => {
    const share = async () => {
        try {
            await navigator.share({ title: 'DogePay request', text: `Pay ${amount} DOGE to ${formatDogeId(name)}`, url });
        } catch {
            /* user dismissed share sheet */
        }
    };

    return (
        <div className="w-full min-w-0 max-w-full space-y-4">
            <div className="text-center">
                <p className="tabular font-display text-4xl">{amount} DOGE</p>
                <p className="mt-1 text-sm text-muted-foreground">to {formatDogeId(name)} · <span className="text-warning">Not paid yet</span></p>
            </div>
            <div className="mx-auto w-fit rounded-lg bg-foreground p-4 text-background">
                <QRCodeSVG value={url} size={180} fgColor="currentColor" bgColor="transparent" level="M" aria-label="QR code of the payment request link" />
            </div>
            <p className="break-all rounded-lg border border-border bg-background/60 p-3 font-mono text-xs">{url}</p>
            <div className="flex min-w-0 flex-wrap gap-3">
                <Button className="flex-1 gap-2 rounded-full" onClick={() => copyToClipboard(url, 'Request link copied')}><Copy className="h-4 w-4" aria-hidden /> Copy link</Button>
                {typeof navigator.share === 'function' && <Button variant="secondary" className="flex-1 gap-2 rounded-full" onClick={share}><Share2 className="h-4 w-4" aria-hidden /> Share</Button>}
            </div>
            <button onClick={onEdit} className="w-full text-center text-xs text-muted-foreground hover:text-primary">Change amount</button>
        </div>
    );
};
