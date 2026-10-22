import { ConnectGate } from '@/components/common/ConnectGate';
import { PageHeader } from '@/components/common/PageHeader';
import { RecentActivity } from '@/components/home/RecentActivity';

const Activity = () => (
    <>
        <PageHeader
            title="Activity"
            description="Transactions you make in DogePay, with their on-chain status. Your complete wallet history is always available on the explorer."
        />
        <ConnectGate reason="Connect to see the transactions you've made with DogePay.">
            <RecentActivity />
        </ConnectGate>
    </>
);

export default Activity;
