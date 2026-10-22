import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AlertTriangle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { AccountMenu } from './AccountMenu';

/** Themed connect / wrong-network / account button built on RainbowKit's flow. */
export const WalletButton = ({ size = 'default', className }: { size?: 'default' | 'lg'; className?: string }) => {
    const { switchToDogeOS, switching } = useNetworkStatus();

    return (
        <ConnectButton.Custom>
            {({ account, chain, mounted, openConnectModal }) => {
                if (!mounted) return <div className="h-10 w-36" aria-hidden />;

                if (!account) {
                    return (
                        <Button
                            onClick={openConnectModal}
                            size={size}
                            className={cn('gold-glow gap-2 rounded-full font-semibold', size === 'lg' && 'h-12 px-7', className)}
                        >
                            <Wallet className="h-4 w-4" aria-hidden /> {t.wallet.connect}
                        </Button>
                    );
                }

                if (chain?.unsupported) {
                    return (
                        <Button onClick={switchToDogeOS} disabled={switching} variant="destructive" className="gap-2 rounded-full">
                            <AlertTriangle className="h-4 w-4" aria-hidden />
                            {switching ? t.wallet.switching : t.wallet.switchNetwork}
                        </Button>
                    );
                }

                return <AccountMenu address={account.address} />;
            }}
        </ConnectButton.Custom>
    );
};
