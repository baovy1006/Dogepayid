import {useQuery} from '@tanstack/react-query';import type {ActivityRecord} from '@/lib/activityStore';
export const API='https://uivbqftrizhjwiftdyqz.supabase.co/functions/v1/social';
export const useChainActivity=(address?:string)=>useQuery({queryKey:['wallet-chain-activity',address],enabled:!!address,
queryFn:async():Promise<ActivityRecord[]>=>{const r=await fetch(API+'?'+new URLSearchParams({op:'transactions',address:address!}));
const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Explorer unavailable');
return (d.items||[]).filter((v:any)=>v&&['send','receive'].includes(v.kind)&&/^0x[0-9a-fA-F]{64}$/.test(v.hash)&&v.timestamp>0);},refetchInterval:30000,retry:1});