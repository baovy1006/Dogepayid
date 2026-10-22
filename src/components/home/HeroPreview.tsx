import { ArrowDown, BadgeCheck } from 'lucide-react';

/** Illustration of name resolution. Clearly labelled as an example — not real data. */
export const HeroPreview = () => (
    <div className="glass-card relative rotate-[1.5deg] p-6 md:p-7" aria-label="Example of paying by name">
        <span className="absolute right-5 top-5 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Example
        </span>
        <p className="eyebrow">You type</p>
        <p className="mt-2 font-display text-4xl text-foreground">@alex.doge</p>

        <div className="my-5 flex items-center gap-3 text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <ArrowDown className="h-4 w-4" aria-hidden />
            <span className="h-px flex-1 bg-border" />
        </div>

        <p className="eyebrow">DogePay resolves on-chain</p>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-4 py-3">
            <span className="truncate font-mono text-sm text-muted-foreground">0x7a3f…c41e</span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                <BadgeCheck className="h-4 w-4" aria-hidden /> Verified owner
            </span>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">You always see the final address before you sign.</p>
    </div>
);
