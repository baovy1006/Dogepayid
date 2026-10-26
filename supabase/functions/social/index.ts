import {createClient} from 'npm:@supabase/supabase-js@2.75.0';
import {verifyMessage,isAddress} from 'npm:viem@2.39.0';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const h={'Access-Control-Allow-Origin':'https://dogepay-id-hackathon.vercel.app','Access-Control-Allow-Headers':'authorization,content-type,apikey','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store'};
const send=(o:unknown,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...h,'content-type':'application/json'}});
const bad=(e:string,s=400)=>send({error:e},s);
const wallet=(v:unknown)=>typeof v==='string'&&isAddress(v)?v.toLowerCase():'';
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))),b=>b.toString(16).padStart(2,'0')).join('');
const key=(a:string,b:string)=>a<b?[a,b]:[b,a];
const at=(s:string)=>new Date(s).getTime();
async function auth(r:Request){const t=r.headers.get('authorization')?.replace(/^Bearer /i,'');if(!t)return '';const {data}=await db.from('dp_sessions').select('wallet').eq('token_hash',await hash(t)).gt('expires_at',new Date().toISOString()).maybeSingle();return data?.wallet||''}
async function relation(a:string,b:string){const [lo,hi]=key(a,b);const {data,error}=await db.from('dp_friendships').select('status,initiator').eq('wallet_low',lo).eq('wallet_high',hi).maybeSingle();if(error)throw error;return data}
const row=(a:string)=>({address:a,name:''});
async function notice(to:string,from:string,kind:string,text=''){await db.from('dp_notices').insert({wallet:to,actor:from,kind,body:text})}
async function handle(r:Request){
 if(r.method==='OPTIONS')return new Response(null,{status:204,headers:h});
 const u=new URL(r.url);let b:any={};
 if(r.method==='POST')try{b=await r.json()}catch{return bad('Invalid JSON')}
 const op=b.op||u.searchParams.get('op');
 if(op==='health')return send({ok:true,store:'supabase-postgres',network:6281971});
 if(op==='lookup'||op==='transactions'){const x=await fetch('https://dogepay-social-api.vercel.app/api/social?'+u.searchParams.toString());return send(await x.json(),x.status)}
 if(op==='challenge'){
  const w=wallet(b.address);if(!w)return bad('Invalid wallet');
  const n=token();const message='DogePay Friends Login\nWallet: '+w+'\nNonce: '+n+'\nDogeOS Testnet 6281971\nExpires: 5 minutes';
  const {error}=await db.from('dp_challenges').upsert({wallet:w,nonce:n,message,expires_at:new Date(Date.now()+300000).toISOString()});
  if(error)throw error;return send({nonce:n,message});
 }
 if(op==='login'){
  const w=wallet(b.address),signature=String(b.signature||'');
  if(!w||!/^0x[0-9a-fA-F]+$/.test(signature))return bad('Invalid signature');
  const {data}=await db.from('dp_challenges').select('*').eq('wallet',w).maybeSingle();
  if(!data||data.nonce!==b.nonce||at(data.expires_at)<Date.now())return bad('Challenge expired',401);
  const yes=await verifyMessage({address:w as any,message:data.message,signature:signature as any}).catch(()=>false);
  if(!yes)return bad('INVALID_SIGNATURE',401);
  await db.from('dp_challenges').delete().eq('wallet',w);
  const t=token(),expiresAt=Date.now()+14400000;
  const {error}=await db.from('dp_sessions').insert({token_hash:await hash(t),wallet:w,expires_at:new Date(expiresAt).toISOString()});
  if(error)throw error;return send({owner:w,token:t,expiresAt});
 }
 const w=await auth(r);if(!w)return bad('Session expired. Sign in again.',401);
 if(op==='state'||op==='sent'){
  const {data,error}=await db.from('dp_friendships').select('*').or('wallet_low.eq.'+w+',wallet_high.eq.'+w).limit(200);
  if(error)throw error;
  const friends:any[]=[],incoming:any[]=[],sent:any[]=[];
  for(const f of data||[]){const p=row(f.wallet_low===w?f.wallet_high:f.wallet_low);if(f.status==='accepted')friends.push(p);else if(f.initiator===w)sent.push(p);else incoming.push(p)}
  return send(op==='sent'?{sent}:{friends,incoming});
 }
 const p=wallet(b.peer||u.searchParams.get('peer'));
 if(op==='request'){
  if(!p||p===w)return bad('Invalid recipient');
  const f=await relation(w,p);if(f?.status==='accepted')return send({alreadyFriends:true});
  if(f?.status==='pending')return send({alreadyRequested:true});
  const [lo,hi]=key(w,p);
  const {error}=await db.from('dp_friendships').insert({wallet_low:lo,wallet_high:hi,initiator:w,status:'pending'});
  if(error)throw error;await notice(p,w,'friend_request');return send({ok:true});
 }
 if(op==='accept'){
  if(!p)return bad('Invalid peer');
  const f=await relation(w,p);if(f?.status!=='pending'||f.initiator!==p)return bad('No pending invitation');
  const [lo,hi]=key(w,p);const {error}=await db.from('dp_friendships').update({status:'accepted'}).eq('wallet_low',lo).eq('wallet_high',hi);
  if(error)throw error;await notice(p,w,'friend_accepted');return send({ok:true});
 }
 if(op==='remove'){
  if(!p)return bad('Invalid peer');const [lo,hi]=key(w,p);const {error}=await db.from('dp_friendships').delete().eq('wallet_low',lo).eq('wallet_high',hi);if(error)throw error;return send({ok:true});
 }
 if(op==='message'){
  const s=typeof b.text==='string'?b.text.trim():'';
  if(!p||!s||s.length>4000)return bad('Invalid message');
  if((await relation(w,p))?.status!=='accepted')return bad('Not connected friends',403);
  const {data,error}=await db.from('dp_messages').insert({sender:w,recipient:p,body:s}).select('*').single();
  if(error)throw error;await notice(p,w,'message',s.slice(0,100));
  return send({ok:true,message:{id:data.id,from:w,to:p,text:s,at:at(data.created_at)}});
 }
 if(op==='messages'){
  if(!p)return bad('Invalid peer');if((await relation(w,p))?.status!=='accepted')return bad('Not connected friends',403);
  const {data,error}=await db.from('dp_messages').select('*').or('and(sender.eq.'+w+',recipient.eq.'+p+'),and(sender.eq.'+p+',recipient.eq.'+w+')').order('created_at',{ascending:false}).limit(100);
  if(error)throw error;return send({messages:(data||[]).reverse().map(v=>({id:v.id,from:v.sender,to:v.recipient,text:v.body,at:at(v.created_at)}))});
 }
 if(op==='notifications'){
  const [{data,error},{data:rd}]=await Promise.all([db.from('dp_notices').select('*').eq('wallet',w).order('at',{ascending:false}).limit(80),db.from('dp_notice_reads').select('last_read').eq('wallet',w).maybeSingle()]);
  if(error)throw error;return send({items:(data||[]).map(v=>({kind:v.kind,actor:v.actor,text:v.body,at:at(v.at)})),lastRead:rd?at(rd.last_read):0});
 }
 if(op==='mark_notifications'){
  const m=Math.min(Number(b.at)||Date.now(),Date.now());const {error}=await db.from('dp_notice_reads').upsert({wallet:w,last_read:new Date(m).toISOString()});
  if(error)throw error;return send({ok:true,lastRead:m});
 }
 if(op==='counts'){
  const {data}=await db.from('dp_friendships').select('*').eq('status','accepted').or('wallet_low.eq.'+w+',wallet_high.eq.'+w);const counts:Record<string,number>={};
  for(const f of (data||[]).slice(0,30)){const peer=f.wallet_low===w?f.wallet_high:f.wallet_low;
   const {data:rd}=await db.from('dp_read_receipts').select('read_at').eq('wallet',w).eq('peer',peer).maybeSingle();
   const {count}=await db.from('dp_messages').select('id',{count:'exact',head:true}).eq('sender',peer).eq('recipient',w).gt('created_at',rd?.read_at||new Date(0).toISOString());
   counts[peer]=count||0;
  }return send({counts});
 }
 if(op==='status'){
  if(!p)return bad('Invalid peer');
  const {data}=await db.from('dp_read_receipts').select('read_at').eq('wallet',p).eq('peer',w).maybeSingle();return send({readAt:data?at(data.read_at):0});
 }
 if(op==='mark_read'){
  if(!p)return bad('Invalid peer');if((await relation(w,p))?.status!=='accepted')return bad('Not friends',403);
  const {error}=await db.from('dp_read_receipts').upsert({wallet:w,peer:p,read_at:new Date(Math.min(Number(b.at)||Date.now(),Date.now())).toISOString()});if(error)throw error;return send({ok:true});
 }
 return bad('Unknown operation',404);
}
Deno.serve(async r=>{try{return await handle(r)}catch(e){console.error('Social API error',e);return bad('Service temporarily unavailable',503)}});