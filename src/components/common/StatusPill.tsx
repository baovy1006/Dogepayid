import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'muted' | 'destructive';

const toneClasses: Record<Tone, string> = {
    success: 'border-success/30 text-success',
    warning: 'border-warning/30 text-warning',
    destructive: 'border-destructive/30 text-destructive',
    muted: 'border-border text-muted-foreground',
};

const dotClasses: Record<Tone, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    muted: 'bg-muted-foreground',
};

export const StatusPill = ({ tone, children, pulse }: { tone: Tone; children: React.ReactNode; pulse?: boolean }) => (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', toneClasses[tone])}>
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone], pulse && 'animate-pulse-dot')} aria-hidden />
        {children}
    </span>
);
