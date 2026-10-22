import { Loader2, Search } from 'lucide-react';
import type { Address } from 'viem';
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

/** Step 1 — type a Doge ID and resolve it on-chain to a verified wallet. */
export const RecipientStep = ({ input, onInput, onNext }: Props) => {
    const { address } = useAccount();
    const contacts = useContacts(address);
    const { name, problem, owner, isLoading, isError, isResolved } = useResolveDogeId(input);
    const isSelf = !!owner && owner.toLowerCase() === address?.toLowerCase();

    let hint: React.ReactNode = null;
    if (name && problem) hint = <span className="text-destructive">{problem}</span>;
    else if (name && isLoading) hint = <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Looking up {formatDogeId(name)}…</span>;
    else if (isError) hint = <span className="text-destructive">Could not reach the registry. Try again.</span>;
    else if (isResolved && !owner) hint = <span className="text-destructive">No wallet has registered {formatDogeId(name)}.</span>;
    else if (isSelf) hint = <span className="text-warning">That's your own Doge ID.</span>;

    return (
        <div className="space-y-4">
            <label htmlFor="send-to" className="eyebrow">To</label>
            <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input id="send-to" autoFocus autoComplete="off" spellCheck={false} value={input} onChange={(e) => onInput(e.target.value)}
                    placeholder="@name.doge" className="h-12 rounded-full bg-background/60 pl-10 font-mono" />
            </div>
            <p className="min-h-4 text-xs text-muted-foreground" aria-live="polite">{hint}</p>
            {owner && !isSelf && !isLoading && <RecipientCard name={name} address={owner} />}
            {!input && contacts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {contacts.slice(0, 6).map((c) => (
                        <button key={c.name} onClick={() => onInput(c.name)} className="interactive rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/40 hover:text-primary">
                            {formatDogeId(c.name)}
                        </button>
                    ))}
                </div>
            )}
            <Button className="h-12 w-full rounded-full" disabled={!owner || isSelf || isLoading} onClick={() => owner && onNext(name, owner)}>Continue</Button>
        </div>
    );
};
