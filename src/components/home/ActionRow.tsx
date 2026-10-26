import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, HandCoins } from 'lucide-react';
import { ReceiveDialog } from '@/components/receive/ReceiveDialog';
import { RequestDialog } from '@/components/request/RequestDialog';
import { SendDialog } from '@/components/send/SendDialog';
import { t } from '@/i18n';
import { CONTRACTS } from '@/lib/config';
import { ActionButton } from './ActionButton';

const REGISTRY_PENDING = 'Opens once the Doge ID registry is deployed';

export const ActionRow = () => {
    const [dialog, setDialog] = useState<'send' | 'receive' | 'request' | null>(null);
    const registryLive = !!CONTRACTS.identityRegistry;
    const setOpen = (name: typeof dialog) => (o: boolean) => setDialog(o ? name : null);

    return (
        <>
            <div className="relative mt-8 flex gap-3">
                <ActionButton icon={ArrowUpRight} label={t.home.send} primary onClick={() => setDialog('send')} soonReason={registryLive ? undefined : REGISTRY_PENDING} />
                <ActionButton icon={ArrowDownLeft} label={t.home.receive} onClick={() => setDialog('receive')} />
                <ActionButton icon={HandCoins} label={t.home.request} onClick={() => setDialog('request')} soonReason={registryLive ? undefined : REGISTRY_PENDING} />
                
            </div>
            <SendDialog open={dialog === 'send'} onOpenChange={setOpen('send')} />
            <ReceiveDialog open={dialog === 'receive'} onOpenChange={setOpen('receive')} />
            <RequestDialog open={dialog === 'request'} onOpenChange={setOpen('request')} />
            
        </>
    );
};
