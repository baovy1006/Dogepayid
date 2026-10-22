import { useEffect, useState } from 'react';
import { loadActivity, subscribeActivity, type ActivityRecord } from '@/lib/activityStore';

/** Transactions this wallet submitted through DogePay on this device. */
export function useActivity(owner?: string): ActivityRecord[] {
    const [records, setRecords] = useState<ActivityRecord[]>(() => (owner ? loadActivity(owner) : []));

    useEffect(() => {
        if (!owner) {
            setRecords([]);
            return;
        }
        const refresh = () => setRecords(loadActivity(owner));
        refresh();
        return subscribeActivity(refresh);
    }, [owner]);

    return records;
}
