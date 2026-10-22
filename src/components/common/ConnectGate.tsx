import { Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { WalletButton } from '@/components/wallet/WalletButton';
import { EmptyState } from './EmptyState';

/** Renders children only when a wallet is connected; otherwise a connect prompt. */
export const ConnectGate = ({ children, reason }: { children: ReactNode; reason: string }) => {
    const { isConnected } = useAccount();
    if (isConnected) return <>{children}</>;

    return (
        <div className="glass-card">
            <EmptyState icon={Wallet} title="Connect your wallet" description={reason} action={<WalletButton />} />
        </div>
    );
};
