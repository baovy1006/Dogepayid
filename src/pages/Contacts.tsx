import { useEffect, useRef, useState } from 'react';
import { Smile, ArrowUpRight, Check, CheckCheck, MessageCircle, Search, Send, ShieldCheck, UserPlus, Users, X, Loader2, RefreshCw } from 'lucide-react';
import { isAddress, getAddress } from 'viem';
import { useAccount } from 'wagmi';
import { toast } from '@/hooks/use-toast';
import { signMessage } from 'wagmi/actions';
import { ConnectGate } from '@/components/common/ConnectGate';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendDialog } from '@/components/send/SendDialog';
import { useResolveDogeId } from '@/hooks/useDogeId';
import { CONTRACTS } from '@/lib/config';
import { formatDogeId } from '@/lib/dogeId';
import { shortenAddress } from '@/lib/format';
import { wagmiConfig } from '@/lib/wagmi';

const RECEIPTS='https://uivbqftrizhjwiftdyqz.supabase.co/functions/v1/social';
const EMOJIS=['😀','😁','😂','🥰','😍','😊','😎','🤩','🥳','😭','❤️','💛','👍','🙏','👏','🎉','🐕','🚀','🔥','💎','💬','🤝','👀','✨'];
const API='https://uivbqftrizhjwiftdyqz.supabase.co/functions/v1/social';
type Person={address:string;name:string};
type Note={id:string;from:string;to:string;text:string;at:number};
type SocialState={friends:Person[];incoming:Person[]};
const EMPTY:SocialState={friends:[],incoming:[]};

async function social(op:string, token?:string, data?:Record<string,unknown>) {
  const url=data?API:API+'?'+new URLSearchParams({op});
  const response=await fetch(url,{method:data?'POST':'GET',headers:{
    'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})
  },...(data?{body:JSON.stringify({...data,op})}:{}) ,cache:'no-store'});
  let result:unknown;
  try{result=await response.json();}catch{throw new Error('The friends service is temporarily unavailable.');}
  if(!response.ok) throw new Error((result as {error?:string})?.error||'Request failed.');
  return result as any;
}
const short=(s:string)=>shortenAddress(s,5);
const label=(p:Person)=>p.name?formatDogeId(p.name):short(p.address);

const Contacts=()=>{
  const {address}=useAccount();
  const [search,setSearch]=useState('');
  const [session,setSession]=useState<{owner:string;token:string}|null>(null);
  const [state,setState]=useState<SocialState>(EMPTY);
  const [sentInvitations,setSentInvitations]=useState<Person[]>([]);
  const [active,setActive]=useState<Person|null>(null);
  const [messages,setMessages]=useState<Note[]>([]);
  const [unreadCounts,setUnreadCounts]=useState<Record<string,number>>({});
  const [peerReadAt,setPeerReadAt]=useState(0);
  const readTracker=useRef<Record<string,number>>({});
  const [emojiOpen,setEmojiOpen]=useState(false);
  const [pendingMessages,setPendingMessages]=useState<Note[]>([]);
  const chatScrollRef=useRef<HTMLDivElement|null>(null);
  const [draft,setDraft]=useState('');
  const [busy,setBusy]=useState(false);
  const [working,setWorking]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [payTo,setPayTo]=useState<string|null>(null);
  const result=useResolveDogeId(search);
  const direct=isAddress(search.trim());
  const found=direct?getAddress(search.trim()):result.owner;
  const foundName=direct?'':result.name;
  const isSelf=!!address&&!!found&&address.toLowerCase()===found.toLowerCase();
  const token=(session?.owner===address?.toLowerCase())?session?.token:undefined;
  const friends=state.friends;
  const incoming=state.incoming;
  const hasFriend=!!found&&friends.some(f=>f.address.toLowerCase()===found.toLowerCase());
  const hasSent=!!found&&sentInvitations.some(f=>f.address.toLowerCase()===found.toLowerCase());

  useEffect(()=>{
    setActive(null);setMessages([]);setState(EMPTY);setUnreadCounts({});readTracker.current={};setError('');
    if(!address){setSession(null);return;}
    const k='dogepay:social:'+address.toLowerCase();
    try{const stored=sessionStorage.getItem(k);setSession(stored?{owner:address.toLowerCase(),token:stored}:null);}
    catch{setSession(null);}
  },[address]);

  useEffect(()=>{
    if(!token)return;
    let live=true;
    const refresh=async()=>{
      try{
        const r=await social('state',token);
        if(live){setState({friends:r.friends||[],incoming:r.incoming||[]});social('sent',token).then(d=>{if(live)setSentInvitations(d.sent||[])}).catch(()=>{});}
      }catch(e){
        if(live&&String(e).includes('Session')) {setSession(null);setState(EMPTY);setError('Session expired. Sign in again.');}
      }
    };
    refresh();
    const t=setInterval(refresh,20000);
    return()=>{live=false;clearInterval(t);};
  },[token]);

  useEffect(()=>{
    if(!active||!token)return;
    let live=true;
    const refresh=async()=>{
      try{
        const r=await fetch(API+'?'+new URLSearchParams({op:'messages',peer:active.address}),{headers:{Authorization:'Bearer '+token},cache:'no-store'});
        if(!r.ok)return;
        const d=await r.json();
        if(live)setMessages(d.messages||[]);
      }catch{}
    };
    refresh();
    const t=setInterval(refresh,2500);
    return()=>{live=false;clearInterval(t);};
  },[token,active?.address]);

  const renew=async()=>{
    if(!address)return;
    setBusy(true);setError('');
    try{
      const challenge=await social('challenge',undefined,{address});
      const signature=await signMessage(wagmiConfig,{account:address,message:challenge.message});
      const login=await social('login',undefined,{address,nonce:challenge.nonce,signature});
      sessionStorage.setItem('dogepay:social:'+address.toLowerCase(),login.token);
      setSession({owner:address.toLowerCase(),token:login.token});
    }catch(e){setError(e instanceof Error?e.message:'Could not sign in.');}
    finally{setBusy(false);}
  };

  const run=async(op:'request'|'accept'|'remove',peer:string)=>{
    if(!token)return;
    setWorking(op+peer);setError('');
    try{
      const actionResult=await social(op,token,{peer});
      toast({title:op==='request'?(actionResult.alreadyRequested?'Invitation already pending':actionResult.alreadyFriends?'Already friends':'Invitation sent'):op==='accept'?'Friend connected':'Contact removed',description:op==='request'?'Your invitation is saved and will appear as pending until accepted.':op==='accept'?'You can now chat and send DOGE from Contacts.':'Your friends list has been updated.'});
      const r=await social('state',token);
      setState({friends:r.friends||[],incoming:r.incoming||[]});
      if(op==='remove'&&active?.address===peer)setActive(null);
      if(op==='request')setSentInvitations((await social('sent',token)).sent||[]);
    }catch(e){setError(e instanceof Error?e.message:'Could not update friendship.');}
    finally{setWorking(null);}
  };

  useEffect(()=>{
    if(!token){setUnreadCounts({});return;}
    let live=true;
    const poll=async()=>{
      try{const r=await fetch(RECEIPTS+'?op=counts',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
        if(r.ok){const d=await r.json();if(live)setUnreadCounts(d.counts||{});}
      }catch{}
    };
    poll();const t=setInterval(poll,8000);
    return()=>{live=false;clearInterval(t);};
  },[token]);
  useEffect(()=>{
    if(!token||!active){setPeerReadAt(0);return;}
    let live=true;
    const poll=async()=>{
      try{const r=await fetch(RECEIPTS+'?'+new URLSearchParams({op:'status',peer:active.address}),{headers:{Authorization:'Bearer '+token},cache:'no-store'});
        if(r.ok){const d=await r.json();if(live)setPeerReadAt(Number(d.peerReadAt)||0);}
      }catch{}
    };
    poll();const t=setInterval(poll,4500);
    return()=>{live=false;clearInterval(t);};
  },[token,active?.address]);
  useEffect(()=>{
    if(!token||!active||!address)return;
    const peer=active.address.toLowerCase();
    const last=Math.max(0,...messages.filter(m=>m.to?.toLowerCase()===address.toLowerCase()&&m.from?.toLowerCase()===peer).map(m=>m.at));
    if(!last||last<=(readTracker.current[peer]||0))return;
    readTracker.current[peer]=last;
    fetch(RECEIPTS,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
      body:JSON.stringify({op:'mark_read',peer,at:last})}).then(async r=>{
        if(!r.ok)throw Error('Read status unavailable');
        setUnreadCounts(old=>({...old,[peer]:0}));
    }).catch(()=>{readTracker.current[peer]=0;});
  },[messages,token,active?.address,address]);
  const send=async()=>{
    if(!token||!active||!address||!draft.trim()||pendingMessages.length>=4)return;
    const text=draft.trim(),peer=active.address;
    const optimistic:Note={id:'pending-'+Date.now()+'-'+Math.random().toString(36).slice(2),from:address.toLowerCase(),to:peer.toLowerCase(),text,at:Date.now()};
    setPendingMessages(prev=>[...prev,optimistic]);
    setDraft('');setError('');
    try {
      const saved=await social('message',token,{peer,text});
      if(saved?.message?.id){
        setMessages(prev=>[...prev.filter(m=>m.id!==saved.message.id),saved.message]);
      }
      setPendingMessages(prev=>prev.filter(m=>m.id!==optimistic.id));
    }catch(e){
      setPendingMessages(prev=>prev.filter(m=>m.id!==optimistic.id));
      setDraft(prev=>prev?prev:text);
      setError(e instanceof Error?e.message:'Message not sent. Please retry.');
    }
  };
  useEffect(()=>{const el=chatScrollRef.current;if(el)el.scrollTop=el.scrollHeight;},[messages.length,pendingMessages.length,active?.address]);
  const card=(p:Person,key:string)=>(
    <div key={key} className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Users className="h-4 w-4"/>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-sm font-semibold">{label(p)} {p.name&&<ShieldCheck className="h-3 w-3 text-success"/>}</div>
        <p className="font-mono text-xs text-muted-foreground">{short(p.address)}</p>
      </div>
      <div className="flex items-center gap-1">
        {(unreadCounts[p.address.toLowerCase()]||0)>0&&<span title="Unread messages" className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{unreadCounts[p.address.toLowerCase()] > 99?'99+':unreadCounts[p.address.toLowerCase()]}</span>}
        <Button size="sm" variant="secondary" className="rounded-full" onClick={()=>{setActive(p);setMessages([]);setPendingMessages([]);setPeerReadAt(0);setEmojiOpen(false);}}>
          <MessageCircle className="h-4 w-4"/> Chat
        </Button>
        <Button size="sm" variant="ghost" className="rounded-full" onClick={()=>setPayTo(p.name||p.address)}>
          <ArrowUpRight className="h-4 w-4"/> Pay
        </Button>
        <Button size="icon" variant="ghost" title="Remove friend" aria-label={'Remove '+label(p)}
          disabled={!!working} onClick={()=>{if(window.confirm('Remove '+label(p)+' from your friends?'))run('remove',p.address);}}>
          <X className="h-4 w-4"/>
        </Button>
      </div>
    </div>
  );

  return <>
    <PageHeader title="Contacts" description="Find verified Doge IDs, connect with friends, and chat from any device."/>
    <ConnectGate reason="Connect your wallet to find Doge IDs and manage your friends.">
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="glass-card space-y-5 p-5 lg:col-span-3 sm:p-6">
          <div className="space-y-3">
            <label htmlFor="contact-search" className="sr-only">Search Doge ID or wallet address</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
              <Input id="contact-search" value={search} onChange={e=>setSearch(e.target.value)} autoComplete="off" spellCheck={false}
                disabled={!CONTRACTS.identityRegistry}
                placeholder="@name.doge or wallet address" className="h-12 rounded-full bg-background/60 pl-10 font-mono text-sm"/>
            </div>
            {!!search.trim()&&<div className="rounded-xl border border-border bg-background/40 p-4">
              {(!direct&&result.isLoading)?<p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Searching on DogeOS...</p>
              :(!direct&&result.problem)?<p className="text-sm text-destructive">{result.problem}</p>
              :(!direct&&result.isError)?<p className="text-sm text-destructive">Registry lookup failed. Check the network and retry.</p>
              :found?(<div className="space-y-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">{direct?short(found):formatDogeId(foundName)} {!direct&&<ShieldCheck className="h-4 w-4 text-success"/>}</p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{found}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{direct?'Direct address — ownership is not Doge ID verified.':'Verified owner from the DogeOS Identity Registry.'}</p>
                </div>
                {!isSelf&&<div className="flex flex-wrap gap-2">
                  {token&&<Button disabled={!!working||hasFriend||hasSent} onClick={()=>run('request',found.toLowerCase())} className="rounded-full">
                    {hasFriend?<Check className="h-4 w-4"/>:<UserPlus className="h-4 w-4"/>}
                    {hasFriend?'Already friends':hasSent?'Invitation sent':'Add friend'}
                  </Button>}
                  {!token&&<Button onClick={renew} disabled={busy} className="rounded-full">Sign in to add</Button>}
                  <Button variant="secondary" className="rounded-full" onClick={()=>setPayTo(foundName||found)}>
                    <ArrowUpRight className="h-4 w-4"/> Pay
                  </Button>
                </div>}
                {isSelf&&<p className="text-xs text-muted-foreground">This is your connected wallet.</p>}
              </div>) : result.isResolved ? <p className="text-sm text-muted-foreground">No registered Doge ID found. Check spelling or enter a wallet address.</p>:null}
            </div>}
          </div>

          {!token?(
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary"/> Sync your friends across devices</div>
              <p className="mt-2 text-sm text-muted-foreground">Sign a one-time login message with your wallet to securely access cloud-saved friends and chats. No gas or blockchain transaction.</p>
              <Button className="mt-4 w-full rounded-full" onClick={renew} disabled={busy}>{busy?'Confirm in your wallet...':'Enable Friends & Chat'}</Button>
            </div>
          ):(<>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Friends ({friends.length})</h2>
              <button className="text-xs text-muted-foreground hover:text-primary" onClick={async()=>{if(token)try{setState(await social('state',token));}catch{}}}>
                <RefreshCw className="inline h-3 w-3"/> Refresh
              </button>
            </div>
            {incoming.length>0&&<section className="space-y-2 rounded-lg border border-primary/30 p-3">
              <p className="text-sm font-semibold text-primary">Friend requests ({incoming.length})</p>
              {incoming.map(p=><div key={p.address} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{label(p)}</span>
                <Button size="sm" disabled={!!working} onClick={()=>run('accept',p.address)}><Check className="h-3.5 w-3.5"/> Accept</Button>
              </div>)}
            </section>}
            {sentInvitations.length>0&&<div className="rounded-lg border border-border p-3"><p className="mb-2 text-sm font-semibold">Sent invitations ({sentInvitations.length})</p>{sentInvitations.map(p=><p key={p.address} className="flex items-center justify-between py-1 text-xs"><span>{label(p)}</span><span className="text-primary">Pending acceptance</span></p>)}</div>}
            {friends.length===0?<EmptyState icon={Users} title="No friends yet" description="Search a registered Doge ID and send a friend request. Accepted friends are saved to your wallet account."/>:
              <div>{friends.map(p=>card(p,p.address))}</div>}
          </>)}
        </section>
        <aside className="glass-card flex min-h-[350px] flex-col p-5 lg:col-span-2 sm:p-6">
          {!active?<div className="my-auto text-center">
            <MessageCircle className="mx-auto mb-4 h-10 w-10 text-muted-foreground"/>
            <h2 className="font-semibold">Messages {Object.values(unreadCounts).reduce((a,b)=>a+b,0)>0&&<span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{Object.values(unreadCounts).reduce((a,b)=>a+b,0)}</span>}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Select an accepted friend to start chatting. Messages are stored privately and synced between your devices.</p>
            <p className="mt-4 text-xs text-muted-foreground">Chats are not end-to-end encrypted. Never share seed phrases or secrets.</p>
          </div>:<>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div><h2 className="font-semibold">{label(active)}</h2><p className="font-mono text-xs text-muted-foreground">{short(active.address)}</p></div>
              <Button size="icon" variant="ghost" aria-label="Close chat" onClick={()=>setActive(null)}><X className="h-4 w-4"/></Button>
            </div>
            <div ref={chatScrollRef} className="my-4 flex min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto rounded-lg bg-background/30 p-3">
              {(messages.length===0&&pendingMessages.length===0)?<p className="m-auto text-center text-xs text-muted-foreground">No messages yet. Say hello!</p>:[...new Map(messages.map(m=>[m.id,m])).values(),...pendingMessages].sort((a,b)=>a.at-b.at).map(m=>
                <div key={m.id} className={'max-w-[85%] rounded-xl px-3 py-2 text-sm '+(m.from===address?.toLowerCase()?'self-end bg-primary/15':'self-start bg-secondary')}>
                  <p className="break-words">{m.text}</p><p className="mt-1 text-[10px] text-muted-foreground">{m.id.startsWith('pending-')?'Sending…':new Date(m.at).toLocaleString()} {m.from===address?.toLowerCase()&&!m.id.startsWith('pending-')&&<span className="ml-2 font-medium">{m.at<=peerReadAt?'Read ✓✓':'Sent ✓'}</span>}</p>
                </div>)}
            </div>
            <div className="relative">
              {emojiOpen&&<div className="absolute bottom-full left-0 z-30 mb-2 grid w-[min(290px,75vw)] grid-cols-8 gap-1 rounded-xl border border-border bg-popover p-2 shadow-xl" role="group" aria-label="Choose emoji">
                {EMOJIS.map(e=><button key={e} type="button" aria-label={'Add '+e} className="rounded-md p-1 text-xl hover:bg-secondary focus-visible:outline-primary" onClick={()=>{setDraft(t=>t+e);setEmojiOpen(false)}}>{e}</button>)}
              </div>}
              <div className="flex gap-2">
              <Button size="icon" variant="secondary" title="Add emoji" aria-label="Choose emoji" aria-expanded={emojiOpen} onClick={()=>setEmojiOpen(v=>!v)}><Smile className="h-4 w-4"/></Button>
              <Input aria-label="Message" value={draft} maxLength={1000} placeholder="Message..." onChange={e=>setDraft(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}/>
              <Button size="icon" disabled={busy||!draft.trim()} aria-label="Send message" onClick={send}><Send className="h-4 w-4"/></Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Plain-text messages · wallet authenticated · syncs periodically</p>
          </>}
        </aside>
      </div>
      {error&&<p role="alert" className="mt-4 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
    </ConnectGate>
    <SendDialog open={payTo!==null} onOpenChange={open=>{if(!open)setPayTo(null);}} initialRecipient={payTo??''}/>
  </>;
};
export default Contacts;