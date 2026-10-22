import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { t } from '@/i18n';
import { TARGET_CHAIN } from '@/lib/config';

/** Shown whenever the connected wallet is on a network other than DogeOS Testnet. */
export const NetworkBanner = () => {
    const { isWrongNetwork, switching, switchToDogeOS } = useNetworkStatus();
    if (!isWrongNetwork) return null;

    return (
        <div role="alert" className="relative z-10 border-b border-warning/30 bg-warning/10">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
                <p className="flex-1 text-foreground">
                    Your wallet is on an unsupported network. Payments are blocked until you switch to {TARGET_CHAIN.name}.
                </p>
                <Button size="sm" onClick={switchToDogeOS} disabled={switching} className="rounded-full">
                    {switching ? t.wallet.switching : t.wallet.switchNetwork}
                </Button>
            </div>
        </div>
    );
};
