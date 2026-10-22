import { PageHeader } from '@/components/common/PageHeader';
import { NetworkSettings } from '@/components/settings/NetworkSettings';
import { SafetySettings } from '@/components/settings/SafetySettings';
import { WalletSettings } from '@/components/settings/WalletSettings';

const Settings = () => (
    <>
        <PageHeader title="Settings" description="Your wallet, network details, and how DogePay keeps you safe." />
        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            <div className="grid content-start gap-4 md:gap-5">
                <WalletSettings />
                <SafetySettings />
            </div>
            <div className="grid content-start gap-4 md:gap-5">
                <NetworkSettings />
            </div>
        </div>
    </>
);

export default Settings;
