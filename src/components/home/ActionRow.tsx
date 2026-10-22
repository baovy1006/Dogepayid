import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, HandCoins } from 'lucide-react';
import { ReceiveDialog } from '@/components/receive/ReceiveDialog';
import { t } from '@/i18n';
import { CONTRACTS } from '@/lib/config';
import { ActionButton } from './ActionButton';

const REGISTRY_PENDING = 'Opens once the Doge ID registry is deployed';

export const ActionRow = () => {
    const [receiveOpen, setReceiveOpen] = useState(false);
    const registryLive = !!CONTRACTS.identityRegistry;

    return (
        <>
            <div className="relative mt-8 flex gap-3">
                <ActionButton icon={ArrowUpRight} label={t.home.send} primary soonReason={registryLive ? undefined : REGISTRY_PENDING} />
                <ActionButton icon={ArrowDownLeft} label={t.home.receive} onClick={() => setReceiveOpen(true)} />
                <ActionButton icon={HandCoins} label={t.home.request} soonReason={registryLive ? undefined : REGISTRY_PENDING} />
            </div>
            <ReceiveDialog open={receiveOpen} onOpenChange={setReceiveOpen} />
        </>
    );
};
