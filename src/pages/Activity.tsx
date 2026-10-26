import { ConnectGate } from '@/components/common/ConnectGate';
import { PageHeader } from '@/components/common/PageHeader';
import { RecentActivity } from '@/components/home/RecentActivity';

const Activity = () => (
    <>
        <PageHeader
            title="Activity"
            description="Incoming and outgoing DOGE transfers, plus local DogePay receipts."
        />
        <ConnectGate reason="Connect to see the transactions you've made with DogePay.">
            <RecentActivity />
        </ConnectGate>
    </>
);

export default Activity;
