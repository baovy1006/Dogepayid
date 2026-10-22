import { ArrowUpRight, AtSign, ExternalLink, PiggyBank } from 'lucide-react';
import { StatusPill } from '@/components/common/StatusPill';
import type { ActivityKind, ActivityRecord } from '@/lib/activityStore';
import { explorerTxUrl } from '@/lib/config';
import { formatDoge, formatTimestamp, shortenAddress } from '@/lib/format';

const KIND_META: Record<ActivityKind, { label: string; icon: typeof ArrowUpRight; sign: string }> = {
    send: { label: 'Sent', icon: ArrowUpRight, sign: '−' },
    register_id: { label: 'Registered Doge ID', icon: AtSign, sign: '' },
    savings_create: { label: 'Created savings goal', icon: PiggyBank, sign: '' },
    savings_deposit: { label: 'Savings deposit', icon: PiggyBank, sign: '−' },
    savings_withdraw: { label: 'Savings withdrawal', icon: PiggyBank, sign: '+' },
};

const STATUS_TONE = { pending: 'warning', confirmed: 'success', failed: 'destructive' } as const;

export const ActivityRow = ({ record }: { record: ActivityRecord }) => {
    const meta = KIND_META[record.kind];
    const Icon = meta.icon;
    const who = record.counterparty?.dogeId ?? (record.counterparty ? shortenAddress(record.counterparty.address) : null);

    return (
        <li className="flex items-center gap-4 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{meta.label}{who && <span className="text-muted-foreground"> · {who}</span>}</p>
                <a href={explorerTxUrl(record.hash)} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary">
                    {shortenAddress(record.hash, 6)} <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
            </div>
            <div className="flex flex-col items-end gap-1">
                {record.amountWei && <p className="tabular text-sm font-medium">{meta.sign}{formatDoge(BigInt(record.amountWei))} DOGE</p>}
                <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-muted-foreground sm:inline">{formatTimestamp(record.timestamp)}</span>
                    <StatusPill tone={STATUS_TONE[record.status]}>{record.status}</StatusPill>
                </div>
            </div>
        </li>
    );
};
