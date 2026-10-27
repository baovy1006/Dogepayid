import { ExternalLink, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ActivityRow } from '@/components/activity/ActivityRow';
import { EmptyState } from '@/components/common/EmptyState';
import { useActivity } from '@/hooks/useActivity';
import { useChainActivity } from '@/hooks/useChainActivity';
import { explorerAddressUrl } from '@/lib/config';

/** Transactions submitted through DogePay, each with a real hash and explorer link. */
export const RecentActivity = ({ limit }: { limit?: number }) => {
    const { address } = useAccount();
    const local=useActivity(address),chain=useChainActivity(address);
    const records=[...new Map([...local,...(chain.data||[])].map(r=>[r.hash+':'+r.kind,r])).values()].sort((a,b)=>b.timestamp-a.timestamp);
    const shown = limit ? records.slice(0, limit) : records;

    return (
        <section className="glass-card p-6" aria-labelledby="activity-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="activity-title" className="dogepay-readable text-sm font-medium">Recent activity</h2>
                <div className="flex items-center gap-4 text-xs">
                    {limit && records.length > limit && <Link to="/activity" className="text-primary hover:underline">See all</Link>}
                    {address && (
                        <a href={explorerAddressUrl(address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
                            Full history on explorer <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                    )}
                </div>
            </div>
            {chain.isError&&<p className="mt-2 text-xs text-warning">Explorer unavailable, showing local receipts. <button onClick={()=>chain.refetch()} className="underline">Retry</button></p>}
            {shown.length === 0 ? (
                <EmptyState
                    compact
                    icon={Receipt}
                    title="No DogePay transactions yet"
                    description="Incoming and outgoing DOGE transfers appear after indexing."
                />
            ) : (
                <ul className="mt-2 divide-y divide-border">
                    {shown.map((r) => <ActivityRow key={r.hash} record={r} />)}
                </ul>
            )}
        </section>
    );
};
