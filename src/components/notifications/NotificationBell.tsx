import {useQueries} from '@tanstack/react-query';
import {isAddress,getAddress} from 'viem';
import {nameOf} from '@/lib/registryService';
import {formatDogeId} from '@/lib/dogeId';
import {useEffect,useState} from 'react';
import {Bell} from 'lucide-react';import {Link} from 'react-router-dom';import {useAccount} from 'wagmi';
import {Popover,PopoverContent,PopoverTrigger} from '@/components/ui/popover';
import {Button} from '@/components/ui/button';import {API,useChainActivity} from '@/hooks/useChainActivity';
import {useActivity} from '@/hooks/useActivity';import {explorerTxUrl} from '@/lib/config';
import {formatDoge,shortenAddress} from '@/lib/format';
type Notice={kind:string;actor:string;text:string;at:number};
export const NotificationBell=()=>{
 const {address}=useAccount(),chain=useChainActivity(address),local=useActivity(address);
 const [token,setToken]=useState(''),[feed,setFeed]=useState<{items:Notice[];lastRead:number}>({items:[],lastRead:0});
 const [seen,setSeen]=useState(0),[open,setOpen]=useState(false);
 useEffect(()=>{setToken('');setFeed({items:[],lastRead:0});
  setSeen(address?Number(localStorage.getItem('dogepay:notif:'+address.toLowerCase())||0):0);
  if(!address)return;
  const tick=()=>setToken(sessionStorage.getItem('dogepay:social:'+address.toLowerCase())||'');
  tick();const t=setInterval(tick,5000);return()=>clearInterval(t);
 },[address]);
 useEffect(()=>{if(!token)return;let alive=true;
  const tick=async()=>{try{const r=await fetch(API+'?op=notifications',{headers:{Authorization:'Bearer '+token}});
    if(r.ok){const d=await r.json();if(alive)setFeed({items:d.items||[],lastRead:d.lastRead||0})}}catch{}};
  tick();const t=setInterval(tick,30000);return()=>{alive=false;clearInterval(t)};
 },[token]);
 const actorNames=useQueries({queries:feed.items.map(n=>({queryKey:['dogeId','of',n.actor?.toLowerCase()],queryFn:()=>nameOf(getAddress(n.actor)),enabled:isAddress(n.actor),staleTime:60000,retry:1}))});
 const notes=feed.items.map((n,i)=>({id:'s'+n.kind+n.at+n.actor,at:n.at,kind:n.kind,read:n.at<=Math.max(feed.lastRead,seen),url:'/contacts',
   title:n.kind==='message'?'New message':n.kind==='friend_request'?'Friend request received':n.kind==='request_sent'?'Invitation sent':n.kind==='friend_accepted'?'Invitation accepted':'Friendship updated',
   detail:(n.kind==='message'?n.text+' · ':'')+(actorNames[i]?.data?formatDogeId(actorNames[i].data):shortenAddress(n.actor,5))}));
 for(const r of new Map([...local,...(chain.data||[])].map(x=>[x.hash+':'+x.kind,x])).values()){
  if(!r.timestamp||r.status==='failed')continue;
  notes.push({id:'t'+r.hash+r.kind,at:r.timestamp,kind:r.kind,read:r.timestamp<=seen,url:explorerTxUrl(r.hash),
   title:r.kind==='receive'?'DOGE received':r.kind==='send'?'DOGE sent':r.kind.replaceAll('_',' '),
   detail:(r.amountWei?formatDoge(BigInt(r.amountWei))+' DOGE · ':'')+(r.counterparty?.address?shortenAddress(r.counterparty.address,5):'DogeOS')});
 }
 notes.sort((a,b)=>b.at-a.at);const displayed=notes.slice(0,40),unread=displayed.filter(n=>!n.read).length;
 const mark=async()=>{if(!address)return;const now=Date.now();
  localStorage.setItem('dogepay:notif:'+address.toLowerCase(),String(now));setSeen(now);
  if(token)try{const r=await fetch(API,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({op:'mark_notifications'})});
   if(r.ok){const d=await r.json().catch(()=>({}));setFeed(f=>({...f,lastRead:Math.max(now,d.lastRead||0)}));}}catch{}
 };
 return <Popover open={open} onOpenChange={v=>{setOpen(v);if(v)void mark();}}>
 <PopoverTrigger asChild><Button variant="ghost" size="icon"
  className="relative h-9 w-9 rounded-full border border-border/90 bg-secondary/65 text-foreground shadow-sm shadow-black/10 transition-colors hover:border-primary/55 hover:bg-secondary hover:text-foreground focus-visible:ring-primary"
  style={{color: 'hsl(var(--foreground))'}}
  aria-label={'Notifications: '+unread+' unread'}>
  <Bell className="h-4 w-4 text-foreground" style={{color: 'hsl(var(--foreground))'}} aria-hidden />{unread>0&&<span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unread>99?'99+':unread}</span>}
 </Button></PopoverTrigger>
 <PopoverContent align="end" className="z-50 w-[min(340px,calc(100vw-20px))] rounded-xl border-border bg-popover p-0 text-popover-foreground shadow-xl shadow-black/30">
 <h3 className="border-b border-border p-3 font-semibold text-popover-foreground">Notifications</h3>
 <div className="max-h-[340px] overflow-y-auto">{displayed.length===0?<p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>:
 displayed.map(n=><div key={n.id} className="border-b border-border/50 p-3">
  <p className="text-sm font-semibold">{n.title}</p><p className="break-words text-xs text-muted-foreground">{n.detail}</p>
  <p className="text-[10px] text-muted-foreground">{new Date(n.at).toLocaleString()}</p>
  {n.url.startsWith('/')?<Link to={n.url} onClick={()=>setOpen(false)} className="text-xs text-primary">Open</Link>:
   <a href={n.url} target="_blank" rel="noreferrer" className="text-xs text-primary">Explorer</a>}
 </div>)}</div>
 {address&&!token&&<Link to="/contacts" className="block border-t border-border p-2 text-xs text-primary" onClick={()=>setOpen(false)}>Sign in to Friends to see message alerts</Link>}
 {chain.isError&&<p className="p-2 text-xs text-warning">Explorer temporarily unavailable.</p>}
 </PopoverContent></Popover>;
};