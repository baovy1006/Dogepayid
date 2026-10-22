import { Check, Loader2, X } from 'lucide-react';
import { formatDogeId, NAME_RULES } from '@/lib/dogeId';

interface Props {
    name: string;
    problem: string | null;
    isLoading: boolean;
    taken: boolean;
    isError: boolean;
}

/** Inline validation + on-chain availability feedback for a candidate Doge ID. */
export const NameAvailability = ({ name, problem, isLoading, taken, isError }: Props) => {
    if (!name) return <p className="text-xs text-muted-foreground">{NAME_RULES}</p>;
    if (problem) return <Line tone="bad">{problem}</Line>;
    if (isLoading) return <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Checking on-chain…</p>;
    if (isError) return <Line tone="bad">Could not reach the registry. Try again.</Line>;
    if (taken) return <Line tone="bad">{formatDogeId(name)} is already taken.</Line>;
    return <Line tone="good">{formatDogeId(name)} is available.</Line>;
};

const Line = ({ tone, children }: { tone: 'good' | 'bad'; children: React.ReactNode }) => (
    <p aria-live="polite" className={`flex items-center gap-1.5 text-xs ${tone === 'good' ? 'text-success' : 'text-destructive'}`}>
        {tone === 'good' ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
        {children}
    </p>
);
