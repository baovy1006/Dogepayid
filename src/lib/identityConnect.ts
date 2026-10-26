import { createClient, type SupabaseClient, type Provider } from '@supabase/supabase-js';
import { signMessage as wagmiSignMessage } from 'wagmi/actions';
import { wagmiConfig } from '@/lib/wagmi';
import type { DogecoinWalletKind } from '@/lib/dogecoinL1Wallet';

const PROJECT_URL = 'https://uivbqftrizhjwiftdyqz.supabase.co';
const PUBLIC_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const authConfigured = Boolean(PUBLIC_KEY);

let client: SupabaseClient | null = null;
export function identityClient(): SupabaseClient {
  if (!PUBLIC_KEY) throw new Error('Social account sign-in is not configured yet.');
  if (!client) client = createClient(PROJECT_URL, PUBLIC_KEY, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });
  return client;
}

export type NetworkWallet = { kind: DogecoinWalletKind | 'dogeos'; address: string };
export type VerifiedLink = { network: 'dogecoin' | 'dogeos'; walletAddress: string; walletKind: string };

export async function oauthX(): Promise<void> {
  const { error } = await identityClient().auth.signInWithOAuth({
    provider: 'x' as unknown as Provider, options: { redirectTo: `${window.location.origin}/?dogepayIdentity=1` },
  });
  if (error) throw error;
}

export async function oauthGoogle(): Promise<void> {
  // This must link to the existing authenticated X account, not create a separate user.
  const { error } = await identityClient().auth.linkIdentity({
    provider: 'google', options: { redirectTo: `${window.location.origin}/?dogepayIdentity=1` },
  });
  if (error) throw error;
}

export async function getSocialIdentity(): Promise<{ x: boolean; google: boolean; userId: string | null }> {
  if (!authConfigured) return { x: false, google: false, userId: null };
  const { data, error } = await identityClient().auth.getUser();
  if (error || !data.user) return { x: false, google: false, userId: null };
  const providers = new Set((data.user.identities ?? []).map(i => i.provider));
  return { x: providers.has('x') || providers.has('twitter'), google: providers.has('google'), userId: data.user.id };
}

async function linkRequest(body: Record<string, unknown>): Promise<any> {
  const { data } = await identityClient().auth.getSession();
  if (!data.session?.access_token) throw new Error('Connect X before verifying your wallet.');
  const response = await fetch(`${PROJECT_URL}/functions/v1/identity-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
      apikey: PUBLIC_KEY,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Identity service unavailable (${response.status}).`);
  return payload;
}

export async function getVerifiedWallets(): Promise<VerifiedLink[]> {
  const r = await linkRequest({ action: 'status' });
  return Array.isArray(r.linked) ? r.linked : [];
}

function extractSignature(value: unknown): string {
  if (typeof value === 'string' && value.length >= 80) return value;
  if (typeof value === 'object' && value) {
    const res = value as Record<string, unknown>;
    for (const key of ['signature', 'signedMessage', 'sig']) {
      if (typeof res[key] === 'string' && (res[key] as string).length >= 80) return res[key] as string;
    }
  }
  throw new Error('The wallet did not return a supported message signature.');
}

async function signWalletMessage(wallet: NetworkWallet, message: string): Promise<string> {
  if (wallet.kind === 'dogeos') {
    return await wagmiSignMessage(wagmiConfig, { account: wallet.address as `0x${string}`, message });
  }
  if (wallet.kind === 'mydoge') {
    const p = window.doge as typeof window.doge & { requestSignedMessage?: (args: { message: string }) => Promise<unknown> };
    if (!p?.requestSignedMessage) throw new Error('This MyDoge version does not expose message signing.');
    return extractSignature(await p.requestSignedMessage({ message }));
  }
  const p = window.dogesoft as typeof window.dogesoft & { signMessage?: (message: string) => Promise<unknown> };
  if (!p?.signMessage) throw new Error('This Doge Soft version does not expose message signing.');
  return extractSignature(await p.signMessage(message));
}

export async function proveAndLinkWallet(wallet: NetworkWallet): Promise<VerifiedLink> {
  const challenge = await linkRequest({ action: 'challenge', walletKind: wallet.kind, walletAddress: wallet.address });
  if (!challenge.challengeId || !challenge.message) throw new Error('Missing wallet verification challenge.');
  const signature = await signWalletMessage(wallet, challenge.message);
  const result = await linkRequest({ action: 'verify', challengeId: challenge.challengeId, signature });
  if (!result.verified || !result.linked) throw new Error('Wallet linkage was not verified.');
  return result.linked as VerifiedLink;
}
