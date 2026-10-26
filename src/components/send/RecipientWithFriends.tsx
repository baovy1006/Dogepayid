import {useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAccount} from 'wagmi';
import {signMessage} from 'wagmi/actions';
import {getAddress,isAddress,type Address} from 'viem';
import {Users,Search,RefreshCw,ShieldCheck,Loader2,ArrowRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {formatDogeId} from '@/lib/dogeId';
import {wagmiConfig} from '@/lib/wagmi';
import {RecipientStep} from './RecipientStep';
const API='https://uivbqftrizhjwiftdyqz.supabase.co/functions/v1/social';
type Friend={address:string;name:string};
interface Props{input:string;onInput:(v:string)=>void;onNext:(name:string,owner:Address)=>void}
async function post(op:string,data:Record<string,unknown>,token?:string){
 const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
  body:JSON.stringify({...data,op})});
 const body=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(body.error||'Friends service unavailable');
 return body;
}
export const RecipientWithFriends=({input,onInput,onNext}:Props)=>{
 const {address}=useAccount();
 const [mode,setMode]=useState<'address'|'friends'>('address');
 const [search,setSearch]=useState('');
 const [token,setToken]=useState('');
 const [signing,setSigning]=useState(false);
 const [error,setError]=useState('');
 const key=address?'dogepay:social:'+address.toLowerCase():'';
 const checkSession=()=>{try{setToken(key?sessionStorage.getItem(key)||'':'');}catch{setToken('');}};
 useEffect(()=>{checkSession();setMode('address');setSearch('');setError('');},[key]);
 const activate=()=>{setMode('friends');setError('');checkSession();};
 const login=async()=>{
  if(!address||signing)return;
  setSigning(true);setError('');
  try{
   const c=await post('challenge',{address});
   const signature=await signMessage(wagmiConfig,{account:address,message:c.message});
   const result=await post('login',{address,nonce:c.nonce,signature});
   sessionStorage.setItem(key,result.token);
   setToken(result.token);
  }catch(e){setError(e instanceof Error?e.message:'Sign-in failed.');}
  finally{setSigning(false);}
 };
 const friends=useQuery({
  queryKey:['send-friends',address?.toLowerCase(),token],
  enabled:!!address&&!!token&&mode==='friends',
  queryFn:async():Promise<Friend[]>=>{
   const r=await fetch(API+'?op=state',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
   const d=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(d.error||'Could not load friends');
   return (Array.isArray(d.friends)?d.friends:[]).filter((p:Friend)=>p&&isAddress(p.address)&&p.address.toLowerCase()!==address?.toLowerCase());
  },refetchOnWindowFocus:true,staleTime:10000,refetchInterval:15000,retry:1
 });
 const matches=(friends.data||[]).filter(p=>(p.name||p.address).toLowerCase().includes(search.trim().toLowerCase()));
 return <div className="space-y-4">
  <div role="tablist" aria-label="Send to" className="grid grid-cols-2 rounded-full border border-border bg-secondary/40 p-1">
   <button role="tab" aria-selected={mode==='address'} onClick={()=>setMode('address')}
    className={'rounded-full px-3 py-2 text-sm font-medium '+(mode==='address'?'bg-card text-primary':'text-muted-foreground')}>Doge ID / Wallet</button>
   <button role="tab" aria-selected={mode==='friends'} onClick={activate}
    className={'rounded-full px-3 py-2 text-sm font-medium '+(mode==='friends'?'bg-card text-primary':'text-muted-foreground')}>Friends</button>
  </div>
  {mode==='address'?<RecipientStep input={input} onInput={onInput} onNext={onNext}/>:
   <div className="space-y-3" role="tabpanel">
    {!address?<p className="text-sm text-muted-foreground">Connect your wallet to see Friends.</p>:
     !token||friends.isError?<div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="text-sm font-semibold">{friends.isError?'Friends session expired':'Access your friends'}</p>
      <p className="mt-2 text-xs text-muted-foreground">Sign a free login message to load your accepted friends from your DogePay account. You do not need to leave Send.</p>
      <Button disabled={signing} onClick={login} className="mt-3 w-full rounded-full">
       {signing?<><Loader2 className="h-4 w-4 animate-spin"/> Confirm in wallet...</>:<>Sign in to Friends <ArrowRight className="h-4 w-4"/></>}
      </Button>
      {error&&<p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
     </div>:<>
      <div className="flex items-center gap-2">
       <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
        <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search accepted friends" className="rounded-full pl-9"/>
       </div>
       <Button size="icon" variant="ghost" aria-label="Refresh friends" onClick={()=>friends.refetch()}><RefreshCw className="h-4 w-4"/></Button>
      </div>
      {friends.isLoading?<p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Loading friends...</p>:
       matches.length===0?<div className="rounded-xl border border-border px-4 py-6 text-center">
        <Users className="mx-auto h-7 w-7 text-muted-foreground"/>
        <p className="mt-2 text-sm font-semibold">{friends.data?.length?'No matching friends':'No accepted friends yet'}</p>
        <p className="mt-1 text-xs text-muted-foreground">Both wallets must complete Add Friend → Accept before someone appears here. Pending invitations do not count as friends.</p>
       </div>:<ul className="max-h-72 divide-y divide-border overflow-y-auto">
        {matches.map(friend=><li key={friend.address}>
          <button className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-secondary/70"
           onClick={()=>onNext(friend.name||'',getAddress(friend.address))}>
           <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Users className="h-5 w-5"/></span>
           <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 text-sm font-medium">{friend.name?formatDogeId(friend.name):'Friend'}{friend.name&&<ShieldCheck className="h-3.5 w-3.5 text-success"/>}</span>
            <span className="block truncate font-mono text-xs text-muted-foreground">{friend.address}</span>
           </span><ArrowRight className="h-4 w-4 text-primary"/>
          </button>
        </li>)}</ul>}
      <p className="text-xs text-muted-foreground">Choose a friend to continue to amount and wallet confirmation.</p>
     </>}
   </div>}
 </div>;
};