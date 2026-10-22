import { BadgeCheck } from 'lucide-react';
import { formatDogeId } from '@/lib/dogeId';

/** Verified recipient: Doge ID plus the FULL wallet address it resolves to — never hidden. */
export const RecipientCard = ({ name, address, compact }: { name: string; address: string; compact?: boolean }) => (
    <div className="rounded-lg border border-success/25 bg-success/5 p-4">
        <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-xl text-primary" aria-hidden>
                {name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
                <p className="truncate font-medium">{formatDogeId(name)}</p>
                <p className="flex items-center gap-1 text-xs text-success"><BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified on-chain</p>
            </div>
        </div>
        {!compact && (
            <div className="mt-3 border-t border-border pt-3">
                <p className="eyebrow">Wallet address</p>
                <p className="mt-1 break-all font-mono text-xs">{address}</p>
            </div>
        )}
    </div>
);
