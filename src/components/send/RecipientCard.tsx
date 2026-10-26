import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { formatDogeId } from '@/lib/dogeId';

export const RecipientCard = ({ name, address, compact }: { name: string; address: string; compact?: boolean }) => (
  <div className={name ? 'rounded-lg border border-success/25 bg-success/5 p-4' : 'rounded-lg border border-warning/30 bg-warning/5 p-4'}>
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-xl text-primary" aria-hidden>{name ? name.charAt(0).toUpperCase() : '0x'}</span>
      <div className="min-w-0">
        <p className="break-all font-medium">{name ? formatDogeId(name) : 'Direct wallet transfer'}</p>
        <p className={name ? 'flex items-center gap-1 text-xs text-success' : 'flex items-center gap-1 text-xs text-warning'}>
          {name ? <><BadgeCheck className="h-3.5 w-3.5" /> Verified on-chain</> : <><ShieldAlert className="h-3.5 w-3.5" /> Address not linked to a verified Doge ID</>}
        </p>
      </div>
    </div>
    {!compact && <div className="mt-3 border-t border-border pt-3"><p className="eyebrow">Destination wallet — verify carefully</p><p className="mt-1 break-all font-mono text-xs">{address}</p></div>}
  </div>
);