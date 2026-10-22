import { Copy } from 'lucide-react';
import { useAccount } from 'wagmi';
import { StatusPill } from '@/components/common/StatusPill';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { t } from '@/i18n';
import { copyToClipboard } from '@/lib/clipboard';
import { TARGET_CHAIN } from '@/lib/config';
import { shortenAddress } from '@/lib/format';
import { ActionRow } from './ActionRow';
import { BalanceAmount } from './BalanceAmount';

export const BalanceCard = () => {
    const { address } = useAccount();
    const { isWrongNetwork } = useNetworkStatus();

    return (
        <section className="glass-card relative h-full overflow-hidden p-6 md:p-8" aria-labelledby="balance-label">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
                {isWrongNetwork ? (
                    <StatusPill tone="warning">{t.wallet.wrongNetwork}</StatusPill>
                ) : (
                    <StatusPill tone="success" pulse>{TARGET_CHAIN.name}</StatusPill>
                )}
                {address && (
                    <button
                        onClick={() => copyToClipboard(address, 'Address copied')}
                        className="interactive flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                        aria-label="Copy wallet address"
                    >
                        {shortenAddress(address)} <Copy className="h-3.5 w-3.5" aria-hidden />
                    </button>
                )}
            </div>
            <p id="balance-label" className="relative mt-8 text-sm text-muted-foreground">{t.home.balance}</p>
            <BalanceAmount />
            <ActionRow />
        </section>
    );
};
