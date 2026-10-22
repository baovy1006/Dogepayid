import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { clearLocalData } from '@/lib/activityStore';
import { SettingRow, SettingsSection } from './SettingsSection';

const PRINCIPLES = [
    'DogePay never asks for your seed phrase or private key.',
    'Every transaction is reviewed and signed in your own wallet.',
    'DogePay never requests unlimited token approvals.',
    'Testnet only. DOGE on DogeOS Testnet has no real-world value.',
    'Contracts have not been independently audited.',
];

export const SafetySettings = () => {
    const onClear = () => {
        clearLocalData();
        toast({ title: 'Local data cleared', description: 'Saved contacts and cached activity were removed from this device.' });
    };

    return (
        <>
            <SettingsSection title="Safety">
                <ul className="space-y-2.5 py-2">
                    {PRINCIPLES.map((p) => (
                        <li key={p} className="flex gap-2.5 text-sm">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden /> {p}
                        </li>
                    ))}
                </ul>
            </SettingsSection>
            <SettingsSection title="Preferences">
                <SettingRow label="Language" value="English" />
                <SettingRow
                    label="Data on this device"
                    value="Contacts and activity cache"
                    action={<Button size="sm" variant="secondary" onClick={onClear} className="rounded-full">Clear</Button>}
                />
            </SettingsSection>
        </>
    );
};
