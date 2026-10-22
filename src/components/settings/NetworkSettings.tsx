import { CONTRACTS, NATIVE_DOGE_ERC20, TESTNET_CONFIG } from '@/lib/config';
import { CopyIcon } from './CopyIcon';
import { SettingRow, SettingsSection } from './SettingsSection';

const ContractValue = ({ address, label }: { address?: string; label: string }) =>
    address ? <><span>{address}</span><CopyIcon value={address} label={label} /></> : <span className="font-sans text-muted-foreground">Not deployed yet</span>;

export const NetworkSettings = () => (
    <>
        <SettingsSection title="Network">
            <SettingRow label="Network" value={TESTNET_CONFIG.name} />
            <SettingRow label="Chain ID" value={TESTNET_CONFIG.chainId} mono />
            <SettingRow label="RPC" value={TESTNET_CONFIG.rpcUrl} mono />
            <SettingRow
                label="Explorer"
                value={<a href={TESTNET_CONFIG.explorerUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{TESTNET_CONFIG.explorerUrl}</a>}
                mono
            />
            <SettingRow label="Native DOGE ERC-20" value={NATIVE_DOGE_ERC20} mono action={<CopyIcon value={NATIVE_DOGE_ERC20} label="Address" />} />
        </SettingsSection>
        <SettingsSection title="Contracts">
            <SettingRow label="Identity Registry" value={<ContractValue address={CONTRACTS.identityRegistry} label="Address" />} mono />
            <SettingRow label="Savings Vault" value={<ContractValue address={CONTRACTS.savingsVault} label="Address" />} mono />
        </SettingsSection>
    </>
);
