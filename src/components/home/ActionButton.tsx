import type { LucideIcon } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
    primary?: boolean;
    /** Feature not live yet: rendered disabled with an honest "Soon" tag. */
    soonReason?: string;
}

export const ActionButton = ({ icon: Icon, label, onClick, primary, soonReason }: ActionButtonProps) => (
    <button
        onClick={onClick}
        disabled={!!soonReason}
        title={soonReason}
        aria-label={soonReason ? `${label} — ${soonReason}` : label}
        className={cn(
            'interactive group relative flex flex-1 flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm font-medium',
            'disabled:cursor-not-allowed disabled:opacity-55',
            primary
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 enabled:gold-glow'
                : 'dogepay-action-secondary border-border bg-secondary/70 hover:border-primary/40 hover:bg-secondary',
        )}
    >
        <Icon className="h-5 w-5" aria-hidden />
        {label}
        {soonReason && (
            <span className="absolute -top-2 right-2 rounded-full border border-border bg-popover px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t.home.soon}
            </span>
        )}
    </button>
);
