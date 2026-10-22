import { ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useDisconnect } from 'wagmi';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { t } from '@/i18n';
import { copyToClipboard } from '@/lib/clipboard';
import { explorerAddressUrl } from '@/lib/config';
import { shortenAddress } from '@/lib/format';

export const AccountMenu = ({ address }: { address: string }) => {
    const { disconnect } = useDisconnect();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="interactive flex h-10 items-center gap-2 rounded-full border border-border bg-card/80 pl-1.5 pr-3 text-sm font-medium hover:border-primary/50"
                aria-label="Wallet menu"
            >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                    <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
                </span>
                <span className="font-mono text-xs tabular">{shortenAddress(address)}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-lg border-border bg-popover p-1.5">
                <DropdownMenuLabel className="eyebrow px-2">Connected wallet</DropdownMenuLabel>
                <p className="break-all px-2 pb-2 font-mono text-xs text-muted-foreground">{address}</p>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => copyToClipboard(address, 'Address copied')} className="gap-2 rounded-md">
                    <Copy className="h-4 w-4" /> {t.wallet.copyAddress}
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2 rounded-md">
                    <a href={explorerAddressUrl(address)} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" /> {t.wallet.viewOnExplorer}
                    </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => disconnect()} className="gap-2 rounded-md text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> {t.wallet.disconnect}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
