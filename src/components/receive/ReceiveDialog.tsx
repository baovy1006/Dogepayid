import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangle, Copy } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { copyToClipboard } from '@/lib/clipboard';
import { TARGET_CHAIN } from '@/lib/config';

interface ReceiveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Public address + QR code for receiving DOGE on DogeOS Testnet. */
export const ReceiveDialog = ({ open, onOpenChange }: ReceiveDialogProps) => {
    const { address } = useAccount();
    if (!address) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm rounded-xl border-border bg-popover">
                <DialogHeader>
                    <DialogTitle className="font-display text-3xl font-normal">Receive DOGE</DialogTitle>
                    <DialogDescription>Share this address or let the sender scan the code.</DialogDescription>
                </DialogHeader>

                <div className="mx-auto rounded-lg bg-foreground p-4 text-background">
                    <QRCodeSVG value={address} size={196} fgColor="currentColor" bgColor="transparent" level="M" aria-label="QR code of your wallet address" />
                </div>

                <div className="rounded-lg border border-border bg-background/60 p-3">
                    <p className="eyebrow">Your wallet address</p>
                    <p className="mt-1 break-all font-mono text-sm">{address}</p>
                </div>

                <Button onClick={() => copyToClipboard(address, 'Address copied')} className="w-full gap-2 rounded-full">
                    <Copy className="h-4 w-4" aria-hidden /> Copy address
                </Button>

                <p className="flex gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
                    Only send DOGE on {TARGET_CHAIN.name}. Funds sent on other networks may be lost.
                </p>
            </DialogContent>
        </Dialog>
    );
};
