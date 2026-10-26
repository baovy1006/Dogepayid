import {ArrowDownLeft,ArrowUpRight,AtSign,ExternalLink,PiggyBank,ShieldCheck} from 'lucide-react';
import {isAddress,getAddress,type Address} from 'viem';
import {StatusPill} from '@/components/common/StatusPill';
import type {ActivityKind,ActivityRecord} from '@/lib/activityStore';
import {useDogeIdOf} from '@/hooks/useDogeId';
import {explorerTxUrl} from '@/lib/config';
import {formatDoge,formatTimestamp,shortenAddress} from '@/lib/format';
import {formatDogeId} from '@/lib/dogeId';
const META:Record<ActivityKind,{title:string;icon:typeof ArrowUpRight;sign:string}>={
 receive:{title:'Received',icon:ArrowDownLeft,sign:'+'},
 send:{title:'Sent',icon:ArrowUpRight,sign:'−'},
 register_id:{title:'Registered Doge ID',icon:AtSign,sign:''},
 savings_create:{title:'Created savings goal',icon:PiggyBank,sign:''},
 savings_deposit:{title:'Savings deposit',icon:PiggyBank,sign:'−'},
 savings_withdraw:{title:'Savings withdrawal',icon:PiggyBank,sign:'+'},
 savings_close:{title:'Savings goal closed',icon:PiggyBank,sign:'+'}
};
const TONE={pending:'warning',confirmed:'success',failed:'destructive'} as const;
export const ActivityRow=({record}:{record:ActivityRecord})=>{
 const meta=META[record.kind];const Icon=meta.icon;
 const raw=record.counterparty?.address;
 const valid=!!raw&&isAddress(raw);
 const resolved=useDogeIdOf(valid?getAddress(raw):undefined);
 const name=resolved.data||null;
 const claimed=record.counterparty?.dogeId||null;
 const dogeId=name?formatDogeId(name):claimed;
 const direction=record.kind==='receive'?'From':record.kind==='send'?'To':'Counterparty';
 return <li className="flex items-start gap-3 py-4 sm:gap-4">
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary"><Icon className="h-4 w-4 text-primary" aria-hidden/></span>
  <div className="min-w-0 flex-1 space-y-1.5">
   <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
    {meta.title}{dogeId&&<span className="text-primary">· {dogeId}</span>}
    {name&&<span title="Current Doge ID bound to this wallet on DogeOS" className="inline-flex items-center gap-1 text-[10px] text-success"><ShieldCheck className="h-3 w-3"/>ID verified</span>}
   </p>
   {valid&&<p className="break-all font-mono text-xs text-muted-foreground"><span className="font-sans">{direction}: </span>{raw}</p>}
   {!valid&&record.counterparty?.dogeId&&<p className="text-xs text-muted-foreground">{record.counterparty.dogeId}</p>}
   <a href={explorerTxUrl(record.hash)} target="_blank" rel="noopener noreferrer"
    className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary" title={record.hash}>
    Tx {shortenAddress(record.hash,6)} <ExternalLink className="h-3 w-3"/>
   </a>
   <p className="text-xs text-muted-foreground">{formatTimestamp(record.timestamp)}</p>
  </div>
  <div className="flex shrink-0 flex-col items-end gap-2">
   {record.amountWei&&<p className="tabular text-sm font-semibold">{meta.sign}{formatDoge(BigInt(record.amountWei))} DOGE</p>}
   <StatusPill tone={TONE[record.status]}>{record.status}</StatusPill>
  </div>
 </li>;
};