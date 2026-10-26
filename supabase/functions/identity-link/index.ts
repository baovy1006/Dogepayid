import { createClient } from 'npm:@supabase/supabase-js@2.75.0';
import { verifyMessage as verifyEvmMessage, isAddress } from 'npm:viem@2.39.0';
import { secp256k1 } from 'npm:@noble/curves@1.9.7/secp256k1';
import { sha256 } from 'npm:@noble/hashes@1.8.0/sha256';
import { ripemd160 } from 'npm:@noble/hashes@1.8.0/ripemd160';

const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const origin = 'https://dogepay-id-hackathon.vercel.app';
const allow = new Set([origin]);
const json = (value: unknown, status = 200, allowOrigin = origin) => new Response(JSON.stringify(value), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store', Vary: 'Origin' },
});
const fail = (message: string, code = 400, allowOrigin = origin) => json({ error: message }, code, allowOrigin);
const isL1Address = (address: unknown): address is string => typeof address === 'string' && /^[DA9][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{25,44}$/.test(address);
const exp = (s: string) => new Date(s).getTime();
const bytesToHex = (b: Uint8Array) => [...b].map(x => x.toString(16).padStart(2, '0')).join('');

/** Pure-JS Dogecoin P2PKH signed-message verifier: no native Node addons. */
function verifyDogecoinSignature(message: string, address: string, signatureBase64: string): boolean {
  if (!/^[A-Za-z0-9+/]{86}[AEIMQUYcgkosw048]=$/.test(signatureBase64)) return false;
  const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
  if (signature.length !== 65 || signature[0] < 27 || signature[0] > 34) return false;
  const flag = signature[0] - 27;
  const recovery = flag & 3;
  const compressed = flag >= 4;
  const encoder = new TextEncoder();
  const prefix = encoder.encode('\x19Dogecoin Signed Message:\n');
  const content = encoder.encode(message);
  let lengthBytes: Uint8Array;
  if (content.length < 253) lengthBytes = new Uint8Array([content.length]);
  else if (content.length <= 65535) lengthBytes = new Uint8Array([253, content.length & 255, content.length >> 8]);
  else return false;
  const bytes = new Uint8Array(prefix.length + lengthBytes.length + content.length);
  bytes.set(prefix, 0);
  bytes.set(lengthBytes, prefix.length);
  bytes.set(content, prefix.length + lengthBytes.length);
  const hash = sha256(sha256(bytes));
  const publicKey = secp256k1.Signature.fromCompact(signature.slice(1))
    .addRecoveryBit(recovery).recoverPublicKey(hash).toRawBytes(compressed);
  const walletHash = ripemd160(sha256(publicKey));
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let bigint = 0n;
  for (const ch of address) {
    const index = alphabet.indexOf(ch);
    if (index < 0) return false;
    bigint = bigint * 58n + BigInt(index);
  }
  const reversed: number[] = [];
  while (bigint > 0n) {
    reversed.push(Number(bigint & 255n));
    bigint >>= 8n;
  }
  const zeroPrefix = (address.match(/^1+/)?.[0].length ?? 0);
  const decoded = new Uint8Array([...Array(zeroPrefix).fill(0), ...reversed.reverse()]);
  if (decoded.length !== 25 || decoded[0] !== 0x1e) return false; // Dogecoin mainnet P2PKH only
  const payload = decoded.slice(0, 21);
  const checksum = sha256(sha256(payload));
  for (let i = 0; i < 4; i++) if (decoded[21 + i] !== checksum[i]) return false;
  for (let i = 0; i < 20; i++) if (walletHash[i] !== decoded[1 + i]) return false;
  return true;
}

type WalletKind = 'mydoge' | 'dogesoft' | 'dogeos';
const networkFor = (k: WalletKind) => k === 'dogeos' ? 'dogeos' : 'dogecoin';

Deno.serve(async (req: Request) => {
  const inputOrigin = req.headers.get('origin') || '';
  const allowOrigin = allow.has(inputOrigin) ? inputOrigin : origin;
  if (req.method === 'OPTIONS') return new Response(null, { status: allow.has(inputOrigin) ? 204 : 403, headers: { 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' } });
  if (inputOrigin && !allow.has(inputOrigin)) return fail('Origin not allowed', 403, allowOrigin);
  if (req.method !== 'POST') return fail('Method not allowed', 405, allowOrigin);

  const accessToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!accessToken) return fail('Sign in with X before linking a wallet.', 401, allowOrigin);
  const { data: authData, error: authError } = await db.auth.getUser(accessToken);
  const user = authData?.user;
  if (authError || !user) return fail('Invalid social session.', 401, allowOrigin);
  if (!(user.identities || []).some(i => i.provider === 'x' || i.provider === 'twitter')) return fail('Verify your X account first.', 403, allowOrigin);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return fail('Invalid JSON', 400, allowOrigin); }
  const action = body.action;
  try {
    if (action === 'status') {
      const { data, error } = await db.from('dp_linked_wallets').select('network,wallet_kind,wallet_address,linked_at').eq('user_id', user.id);
      if (error) throw error;
      return json({ linked: (data || []).map(r => ({ network: r.network, walletKind: r.wallet_kind, walletAddress: r.wallet_address, linkedAt: r.linked_at })) }, 200, allowOrigin);
    }
    if (action === 'challenge') {
      const kind = body.walletKind as WalletKind;
      let address = body.walletAddress;
      if (!['mydoge', 'dogesoft', 'dogeos'].includes(kind)) return fail('Unsupported wallet.', 400, allowOrigin);
      if (kind === 'dogeos') {
        if (typeof address !== 'string' || !isAddress(address)) return fail('Invalid EVM address.', 400, allowOrigin);
        address = address.toLowerCase();
      } else if (!isL1Address(address)) return fail('Invalid Dogecoin address.', 400, allowOrigin);
      const walletAddress = String(address);
      const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(24)));
      const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
      const message = [
        'DogePay ID wallet verification',
        'Action: Link wallet to verified X account',
        `Domain: ${origin}`,
        `Social user: ${user.id}`,
        `Network: ${networkFor(kind)}`,
        `Wallet: ${walletAddress}`,
        `Nonce: ${nonce}`,
        `Expires: ${expiresAt}`,
        'This signature does NOT authorize a transaction, transfer, or spending.',
      ].join('\n');
      const { data, error } = await db.from('dp_identity_link_challenges').insert({ user_id: user.id, wallet_kind: kind, wallet_address: walletAddress, message, expires_at: expiresAt }).select('id').single();
      if (error) throw error;
      return json({ challengeId: data.id, message, expiresAt }, 200, allowOrigin);
    }
    if (action === 'verify') {
      if (typeof body.challengeId !== 'string' || typeof body.signature !== 'string' || body.signature.length > 400) return fail('Invalid verification payload.', 400, allowOrigin);
      // Atomic delete ensures a challenge can only be attempted once and cannot be replayed.
      const { data: challenge, error } = await db.from('dp_identity_link_challenges')
        .delete().eq('id', body.challengeId).eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .select('wallet_kind,wallet_address,message,expires_at').maybeSingle();
      if (error) throw error;
      if (!challenge || exp(challenge.expires_at) <= Date.now()) return fail('Challenge expired or already used.', 401, allowOrigin);
      let verified = false;
      if (challenge.wallet_kind === 'dogeos') {
        verified = await verifyEvmMessage({ address: challenge.wallet_address as `0x${string}`, message: challenge.message, signature: body.signature as `0x${string}` }).catch(() => false);
      } else {
        try {
          // The Dogecoin Signed Message prefix is required: Bitcoin's default prefix is wrong.
          verified = verifyDogecoinSignature(challenge.message, challenge.wallet_address, body.signature);
        } catch { verified = false; }
      }
      if (!verified) return fail('Invalid wallet signature. Nothing was linked.', 401, allowOrigin);
      const network = networkFor(challenge.wallet_kind);
      const { error: upsertError } = await db.from('dp_linked_wallets').upsert({
        user_id: user.id, network, wallet_kind: challenge.wallet_kind, wallet_address: challenge.wallet_address, linked_at: new Date().toISOString(),
      }, { onConflict: 'user_id,network' });
      if (upsertError) {
        if (upsertError.code === '23505') return fail('This wallet is already linked to a different social account.', 409, allowOrigin);
        throw upsertError;
      }
      return json({ verified: true, linked: { network, walletKind: challenge.wallet_kind, walletAddress: challenge.wallet_address } }, 200, allowOrigin);
    }
    return fail('Unsupported action.', 404, allowOrigin);
  } catch (error) {
    console.error('identity-link error', error instanceof Error ? error.message : 'unknown');
    return fail('Identity service temporarily unavailable.', 503, allowOrigin);
  }
});
