import { Loader2, Search, ShieldAlert } from 'lucide-react';
import { getAddress, isAddress, type Address } from 'viem';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContacts } from '@/hooks/useContacts';
import { useResolveDogeId } from '@/hooks/useDogeId';
import { formatDogeId } from '@/lib/dogeId';
import { RecipientCard } from './RecipientCard';

interface Props {
    input: string;
    onInput: (v: string) => void;
    onNext: (name: string, owner: Address) => void;
}

export const RecipientStep = ({ input, onInput, onNext }: Props) => {
    const { address } = useAccount();
    const contacts = useContacts(address);
    const resolved = useResolveDogeId(input);
    const addressInput = input.trim();
    const direct = isAddress(addressInput);
    const owner = direct ? getAddress(addressInput) : resolved.owner;
    const name = direct ? '' : resolved.name;
    const busy = !direct && resolved.isLoading;
    const isSelf = !!owner && owner.toLowerCase() === address?.toLowerCase();

    let hint: React.ReactNode = null;
    if (direct) hint = <span className="inline-flex gap-1.5 text-warning"><ShieldAlert className="h-3.5 w-3.5" /> Direct wallet address — not Doge ID verified. Check every character.</span>;
    else if (addressInput.startsWith('0x')) hint = <span className="text-destructive">Enter a full valid 0x wallet address.</span>;
    else if (name && resolved.problem) hint = <span className="text-destructive">{resolved.problem}</span>;
    else if (name && busy) hint = <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Looking up {formatDogeId(name)}…</span>;
    else if (resolved.isError) hint = <span className="text-destructive">Could not reach the registry. Try again.</span>;
    else if (resolved.isResolved && !owner) hint = <span className="text-destructive">No wallet registered {formatDogeId(name)}.</span>;
    if (isSelf) hint = <span className="text-warning">This is your own wallet. Choose another recipient.</span>;

    return <div className="space-y-4">
        <label htmlFor="send-to" className="eyebrow">Recipient</label>
        <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="send-to" autoFocus autoComplete="off" spellCheck={false} value={input} onChange={e => onInput(e.target.value)}
                placeholder="@name.doge or 0x wallet address" className="h-12 rounded-full bg-background/60 pl-10 font-mono text-xs sm:text-sm" />
        </div>
        <p className="min-h-5 text-xs text-muted-foreground" aria-live="polite">{hint}</p>
        {owner && !isSelf && !busy && <RecipientCard name={name} address={owner} />}
        {!input && contacts.length > 0 && <div className="flex flex-wrap gap-2">{contacts.slice(0,6).map(c =>
            <button key={c.name} onClick={() => onInput(c.name)} className="interactive rounded-full border border-border px-3 py-1.5 text-xs hover:text-primary">{formatDogeId(c.name)}</button>
        )}</div>}
        <Button className="h-12 w-full rounded-full" disabled={!owner || isSelf || busy || (!direct && !resolved.isResolved)}
            onClick={() => owner && onNext(name, owner)}>Continue</Button>
    </div>;
};