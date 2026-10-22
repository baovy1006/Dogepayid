import { LogOut } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import { StatusPill } from '@/components/common/StatusPill';
import { Button } from '@/components/ui/button';
import { WalletButton } from '@/components/wallet/WalletButton';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { CopyIcon } from './CopyIcon';
import { SettingRow, SettingsSection } from './SettingsSection';

export const WalletSettings = () => {
    const { address, connector } = useAccount();
    const { disconnect } = useDisconnect();
    const { isWrongNetwork } = useNetworkStatus();

    if (!address) {
        return (
            <SettingsSection title="Wallet">
                <SettingRow label="Status" value="Not connected" action={<WalletButton />} />
            </SettingsSection>
        );
    }

    return (
        <SettingsSection title="Wallet">
            <SettingRow label="Address" value={address} mono action={<CopyIcon value={address} label="Address" />} />
            <SettingRow label="Wallet app" value={connector?.name ?? 'Browser wallet'} />
            <SettingRow
                label="Network status"
                value={isWrongNetwork ? <StatusPill tone="warning">Wrong network</StatusPill> : <StatusPill tone="success">Connected</StatusPill>}
            />
            <div className="pt-4">
                <Button variant="secondary" onClick={() => disconnect()} className="gap-2 rounded-full">
                    <LogOut className="h-4 w-4" aria-hidden /> Disconnect
                </Button>
            </div>
        </SettingsSection>
    );
};
