import { useCallback, useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Loader2, Link2, Wallet, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { copyToClipboard } from '@/lib/clipboard';
import { shortenAddress } from '@/lib/format';
import {
  connectDogecoinWallet, disconnectDogecoinWallet, dogecoinWalletAvailable, restoreDogecoinWallet,
  type DogecoinL1Session, type DogecoinWalletKind,
} from '@/lib/dogecoinL1Wallet';
import {
  authConfigured, getSocialIdentity, getVerifiedWallets, identityClient,
  oauthGoogle, oauthX, proveAndLinkWallet, type NetworkWallet, type VerifiedLink,
} from '@/lib/identityConnect';

type Stage = 'wallet' | 'social' | 'verify' | 'done';
type Social = { x: boolean; google: boolean; userId: string | null };
const EMPTY_SOCIAL: Social = { x: false, google: false, userId: null };
const stepNames = ['Connect wallet', 'Connect X', 'Sign & verify'];
const walletOptions: { kind: DogecoinWalletKind; name: string; url: string }[] = [
  { kind: 'mydoge', name: 'MyDoge', url: 'https://mydoge.com/' },
  { kind: 'dogesoft', name: 'Doge Soft', url: 'https://dogesoft.io/extension' },
];

/** One entry point for wallet, social OAuth, and server-verified signature ownership. */
export const UnifiedWalletButton = () => {
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { disconnectAsync: disconnectEvmAsync } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('wallet');
  const [l1, setL1] = useState<DogecoinL1Session | null>(null);
  const [selected, setSelected] = useState<NetworkWallet | null>(null);
  const [social, setSocial] = useState<Social>(EMPTY_SOCIAL);
  const [verified, setVerified] = useState<VerifiedLink[]>([]);
  const [detected, setDetected] = useState({ mydoge: false, dogesoft: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!authConfigured) return;
    const info = await getSocialIdentity();
    setSocial(info);
    if (!info.userId || !info.x) { setVerified([]); return; }
    try { setVerified(await getVerifiedWallets()); } catch { setVerified([]); }
  }, []);

  useEffect(() => {
    let alive = true;
    const detect = () => {
      if (!alive) return;
      setDetected({ mydoge: dogecoinWalletAvailable('mydoge'), dogesoft: dogecoinWalletAvailable('dogesoft') });
    };
    detect();
    const late = window.setTimeout(detect, 750);
    restoreDogecoinWallet().then(session => {
      if (alive && session) {
        setL1(session);
        setSelected(old => old ?? { kind: session.kind, address: session.address });
      }
    }).catch(() => {});
    window.addEventListener('doge#initialized', detect);
    window.addEventListener('dogesoft#initialized', detect);
    if (authConfigured) {
      refresh().catch(() => {});
      const { data: listener } = identityClient().auth.onAuthStateChange(() => { window.setTimeout(() => { void refresh().catch(() => {}); }, 0); });
      if (new URLSearchParams(window.location.search).has('dogepayIdentity')) setOpen(true);
      return () => {
        alive = false;
        window.clearTimeout(late);
        window.removeEventListener('doge#initialized', detect);
        window.removeEventListener('dogesoft#initialized', detect);
        listener.subscription.unsubscribe();
      };
    }
    return () => {
      alive = false;
      window.clearTimeout(late);
      window.removeEventListener('doge#initialized', detect);
      window.removeEventListener('dogesoft#initialized', detect);
    };
  }, [refresh]);

  useEffect(() => {
    if (evmConnected && evmAddress && selected?.kind === 'dogeos') {
      setSelected({ kind: 'dogeos', address: evmAddress });
      setStage(current => current === 'wallet' ? 'social' : current);
    }
  }, [evmConnected, evmAddress, selected?.kind]);

  const matched = selected && verified.some(item =>
    item.walletKind === selected.kind && item.walletAddress.toLowerCase() === selected.address.toLowerCase());
  const connectedWalletCount = Number(!!l1) + Number(evmConnected);
  const hasActiveSession = connectedWalletCount > 0 || !!social.userId;
  const stepIndex = stage === 'wallet' ? 0 : stage === 'social' ? 1 : 2;

  const start = () => {
    setError('');
    if (social.x && selected && matched) setStage('done');
    else if (social.x && selected) setStage('verify');
    else if (selected) setStage('social');
    else setStage('wallet');
    setOpen(true);
    void refresh().catch(() => {});
  };

  useEffect(() => {
    const requestOpen = () => start();
    window.addEventListener('dogepay:open-wallet', requestOpen);
    return () => window.removeEventListener('dogepay:open-wallet', requestOpen);
  });

  const connectL1 = async (kind: DogecoinWalletKind) => {
    setLoading(true); setError('');
    try {
      const session = await connectDogecoinWallet(kind);
      setL1(session);
      setSelected({ kind, address: session.address });
      setStage(social.x ? 'verify' : 'social');
    } catch (e) { setError(e instanceof Error ? e.message : 'Wallet connection failed.'); }
    finally { setLoading(false); }
  };

  /** Disconnect every active session on this device, without deleting verified links. */
  const disconnect = async () => {
    if (loading || !hasActiveSession) return;
    setLoading(true); setError('');
    const errors: string[] = [];
    if (l1) {
      try {
        await disconnectDogecoinWallet(l1.kind);
        setL1(null);
      } catch { errors.push('Dogecoin wallet'); }
    }
    if (evmConnected) {
      try { await disconnectEvmAsync(); }
      catch { errors.push('DogeOS wallet'); }
    }
    if (authConfigured && social.userId) {
      try {
        // Local scope: do not log out other browsers or phones.
        const { error: signOutError } = await identityClient().auth.signOut({ scope: 'local' });
        if (signOutError) throw signOutError;
        setSocial(EMPTY_SOCIAL);
        setVerified([]);
      } catch { errors.push('X / Google session'); }
    }
    if (errors.length) {
      setError(`Could not disconnect: ${errors.join(', ')}. Please retry.`);
    } else {
      // Friends & Chat use a separate wallet-signed session on this browser.
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key?.startsWith('dogepay:social:')) sessionStorage.removeItem(key);
        }
      } catch { /* Storage may be disabled; connected accounts still disconnect. */ }
      setSelected(null);
      setStage('wallet');
      setOpen(false);
      window.dispatchEvent(new Event('dogepay:account-disconnected'));
    }
    setLoading(false);
  };

  const runOAuth = async (provider: 'x' | 'google') => {
    setLoading(true); setError('');
    try { if (provider === 'x') await oauthX(); else await oauthGoogle(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Social authentication failed.'); setLoading(false); }
    // Successful OAuth redirects the browser to the provider and then back to DogePay ID.
  };

  const signAndVerify = async () => {
    if (!selected) { setStage('wallet'); return; }
    setLoading(true); setError('');
    try {
      const result = await proveAndLinkWallet(selected);
      setVerified(previous => [...previous.filter(i => i.network !== result.network), result]);
      setStage('done');
    } catch (e) { setError(e instanceof Error ? e.message : 'Signature verification failed.'); }
    finally { setLoading(false); }
  };

  return (
    <ConnectButton.Custom>
      {({ mounted, openConnectModal }) => <>
        <div className="flex items-center gap-1.5">
          <Button type="button" size="sm" disabled={!mounted} onClick={start}
            className="h-10 gap-2 rounded-full px-2 font-semibold sm:px-4" aria-label="Connect or manage wallets and social accounts">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{matched && social.x ? 'DogePay Account' : hasActiveSession ? 'My Wallet' : 'Connect Wallet'}</span>
            <span className="sm:hidden">Wallet</span>
          </Button>
          {hasActiveSession && <Button type="button" size="sm" variant="outline" disabled={loading}
            onClick={() => void disconnect()} aria-label="Disconnect wallets and sign out of X and Google"
            className="hidden h-9 gap-1 rounded-full border-destructive/40 px-2 text-xs text-destructive hover:bg-destructive/10 sm:inline-flex sm:px-3">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Disconnect
          </Button>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border-border bg-popover p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{stage === 'done' ? 'Account connected' : 'Connect your DogePay ID'}</DialogTitle>
              <DialogDescription>One account for your wallet, X identity, and optional Google sign-in.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2" aria-label={`Step ${stepIndex + 1} of 3`}>
              {stepNames.map((label, index) => <div key={label} className="min-w-0 space-y-1 text-center">
                <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${index <= stepIndex ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  {index < stepIndex || stage === 'done' ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
              </div>)}
            </div>

            {stage === 'wallet' && <div className="space-y-3">
              <p className="text-sm font-semibold">1. Choose your wallet</p>
              <p className="text-xs text-muted-foreground">Dogecoin L1 wallets are recommended for DogePay identity. DogeOS wallets remain available for testnet payments.</p>
              {walletOptions.map(choice => <div key={choice.kind} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/40 p-3">
                <div className="min-w-0"><p className="font-semibold">{choice.name}</p><p className="text-xs text-muted-foreground">Dogecoin L1 · {detected[choice.kind] ? 'Detected' : 'Extension not detected'}</p></div>
                {detected[choice.kind]
                  ? <Button size="sm" disabled={loading} onClick={() => void connectL1(choice.kind)}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}</Button>
                  : <a className="inline-flex items-center gap-1 text-xs font-semibold text-primary" href={choice.url} target="_blank" rel="noopener noreferrer">Get wallet <ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>)}
              {evmConnected && evmAddress ? <Button variant="outline" className="w-full justify-between" onClick={() => { setSelected({ kind: 'dogeos', address: evmAddress }); setStage(social.x ? 'verify' : 'social'); }}>
                DogeOS · {shortenAddress(evmAddress)} <ChevronRight className="h-4 w-4" /></Button>
              : <Button variant="outline" className="w-full justify-between" onClick={() => { if (openConnectModal) { setSelected({ kind: 'dogeos', address: '' }); setOpen(false); openConnectModal(); } }}>Connect DogeOS Wallet <ChevronRight className="h-4 w-4" /></Button>}
            </div>}

            {stage === 'social' && <div className="space-y-3">
              <Button variant="ghost" size="sm" className="justify-start" onClick={() => setStage('wallet')}><ChevronLeft className="h-4 w-4" /> Change wallet</Button>
              <div className="rounded-xl border border-border p-3 text-xs">Wallet: <span className="font-mono">{selected?.address}</span></div>
              <p className="text-sm font-semibold">2. Connect your X account</p>
              {!authConfigured && <p role="alert" className="text-sm text-warning">OAuth requires the public Supabase project key and X provider configuration.</p>}
              <Button className="w-full" disabled={!authConfigured || loading} onClick={() => void runOAuth('x')}>
                {social.x ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                {social.x ? 'X Connected' : 'Continue with X'}
              </Button>
              <p className="text-xs text-muted-foreground">Google/Gmail can be linked to the same X account, not created as a separate DogePay identity.</p>
              <Button variant="outline" className="w-full" disabled={!social.x || loading} onClick={() => void runOAuth('google')}>
                {social.google ? 'Google connected' : 'Add Google (optional)'}
              </Button>
              <Button className="w-full" variant="secondary" disabled={!social.x || !selected?.address} onClick={() => setStage('verify')}>
                Continue to wallet signature <ChevronRight className="h-4 w-4" />
              </Button>
            </div>}

            {stage === 'verify' && <div className="space-y-3">
              <Button size="sm" variant="ghost" className="justify-start" onClick={() => setStage('social')}><ChevronLeft className="h-4 w-4" /> Back to social accounts</Button>
              <p className="text-sm font-semibold">3. Confirm wallet ownership</p>
              <p className="text-sm text-muted-foreground">Approve a free message signature in your wallet. The server will verify that this wallet belongs to you and link it with your authenticated X profile.</p>
              {selected && <div className="break-all rounded-xl border border-border p-3 font-mono text-xs">{selected.kind}: {selected.address}</div>}
              {social.x ? <Button className="h-12 w-full" disabled={!selected?.address || loading} onClick={() => void signAndVerify()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Sign and verify wallet
              </Button> : <Button className="w-full" onClick={() => setStage('social')}>Connect X first</Button>}
            </div>}

            {stage === 'done' && <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="flex items-center gap-2 font-semibold"><Check className="h-5 w-5 text-primary" /> Identity verified</p>
              <p className="text-sm">Your wallet and X identity are linked through a verified signature.</p>
              <p className="break-all font-mono text-xs">{selected?.address}</p>
              <p className="text-xs text-muted-foreground">Google: {social.google ? 'Connected' : 'Not connected (optional)'}</p>
              {!social.google && <Button variant="secondary" className="w-full" disabled={loading} onClick={() => void runOAuth('google')}>Add Google to this account</Button>}
              <Button variant="outline" className="w-full" onClick={() => void copyToClipboard(selected?.address || '', 'Wallet address copied')}><Copy className="h-4 w-4" /> Copy wallet address</Button>
              <Button variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => void disconnect()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Disconnect
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStage('wallet')}>Connect another wallet</Button>
            </div>}
            {stage !== 'done' && selected?.address && <p className="text-xs text-muted-foreground">Wallet selected: {shortenAddress(selected.address)}</p>}
            {stage !== 'done' && hasActiveSession && <Button variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => void disconnect()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Disconnect
            </Button>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">DogePay never requests seed phrases. X/Google linking requires OAuth approval. Signing a message does not transfer DOGE. Dogecoin L1 mainnet and DogeOS Testnet remain separate.</p>
          </DialogContent>
        </Dialog>
      </>}
    </ConnectButton.Custom>
  );
};
