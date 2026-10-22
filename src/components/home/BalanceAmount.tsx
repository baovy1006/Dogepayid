import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDogeBalance } from '@/hooks/useDogeBalance';
import { t } from '@/i18n';
import { formatDoge } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Live native DOGE balance with loading, error and refresh states. */
export const BalanceAmount = () => {
    const { value, isLoading, isFetching, isError, refetch } = useDogeBalance();

    if (isLoading) return <Skeleton className="relative mt-2 h-14 w-56 rounded-lg bg-secondary" aria-label="Loading balance" />;

    if (isError || value === undefined) {
        return (
            <div className="relative mt-2 flex flex-wrap items-center gap-3" role="alert">
                <p className="text-sm text-destructive">Couldn't reach the DogeOS network to load your balance.</p>
                <Button size="sm" variant="secondary" onClick={() => refetch()} className="rounded-full">{t.common.retry}</Button>
            </div>
        );
    }

    return (
        <div className="relative mt-1 flex items-end gap-3">
            <p className="tabular font-display text-5xl leading-none tracking-tight sm:text-6xl" aria-live="polite">
                {formatDoge(value)}
                <span className="ml-2 font-sans text-lg font-medium text-muted-foreground">DOGE</span>
            </p>
            <button
                onClick={() => refetch()}
                className="interactive mb-1 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Refresh balance"
            >
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
            </button>
        </div>
    );
};
