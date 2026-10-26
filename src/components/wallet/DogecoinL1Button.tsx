import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Loader2, Wallet, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { copyToClipboard } from '@/lib/clipboard';
import {
  connectDogecoinWallet,
  disconnectDogecoinWallet,
  dogecoinWalletAvailable,
  restoreDogecoinWallet,
  type DogecoinL1Session,
  type DogecoinWalletKind,
} from '@/lib/dogecoinL1Wallet';

const walletChoices: {kind: DogecoinWalletKind; title: string; url: string}[] = [
  { kind: 'mydoge', title: 'MyDoge', url: 'https://mydoge.com/' },
  { kind: 'dogesoft', title: 'Doge Soft', url: 'https://dogesoft.io/extension' },
];

export const DogecoinL1Button = () => {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<DogecoinL1Session | null>(null);
  const [working, setWorking] = useState<DogecoinWalletKind | 'disconnect' | null>(null);
  const [error, setError] = useState('');
  const [detected, setDetected] = useState({ mydoge: false, dogesoft: false });

  useEffect(() => {
    let active = true;
    const refresh = () => setDetected({
      mydoge: dogecoinWalletAvailable('mydoge'),
      dogesoft: dogecoinWalletAvailable('dogesoft'),
    });
    refresh();
    restoreDogecoinWallet().then(found => { if (active && found) setSession(found); }).catch(() => {});
    window.addEventListener('doge#initialized', refresh);
    window.addEventListener('dogesoft#initialized', refresh);
    return () => {
      active = false;
      window.removeEventListener('doge#initialized', refresh);
      window.removeEventListener('dogesoft#initialized', refresh);
    };
  }, []);

  const connect = async (kind: DogecoinWalletKind) => {
    if (working) return;
    setWorking(kind);
    setError('');
    try {
      const result = await connectDogecoinWallet(kind);
      setSession(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect Dogecoin wallet.');
    } finally { setWorking(null); }
  };

  const disconnect = async () => {
    if (!session || working) return;
    setWorking('disconnect');
    setError('');
    try {
      await disconnectDogecoinWallet(session.kind);
      setSession(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not disconnect wallet.'); }
    finally { setWorking(null); }
  };

  return <>
    <Button
      type="button" variant="outline" size="sm" onClick={() => setOpen(true)}
      className="h-10 gap-1.5 rounded-full border-primary/30 px-2.5 text-xs font-semibold sm:px-3"
      aria-label="Manage Dogecoin Layer 1 wallet"
    >
      <Wallet className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">{session ? 'DOGE L1 ✓' : 'DOGE L1'}</span>
      <span className="sm:hidden">L1</span>
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-xl border-border bg-popover">
        <DialogHeader>
          <DialogTitle>Dogecoin Wallet</DialogTitle>
          <DialogDescription>Connect your Dogecoin Layer 1 wallet separately from your DogeOS testnet wallet.</DialogDescription>
        </DialogHeader>
        {session ? <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-primary"/> {session.kind === 'mydoge' ? 'MyDoge' : 'Doge Soft'} connected</p>
          <p className="break-all font-mono text-xs">{session.address}</p>
          <p className="text-sm">{session.balanceDoge !== null ? `${session.balanceDoge} DOGE` : 'Balance temporarily unavailable'}</p>
          <p className="text-xs text-muted-foreground">Dogecoin L1 · Mainnet · Balance is separate from DogeOS Testnet.</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => copyToClipboard(session.address, 'Dogecoin address copied')}><Copy className="h-4 w-4"/> Copy address</Button>
            <Button variant="outline" className="flex-1" disabled={!!working} onClick={disconnect}>
              {working === 'disconnect' ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4"/>} Disconnect
            </Button>
          </div>
        </div> : <div className="space-y-3">
          {walletChoices.map(choice => <div key={choice.kind} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{choice.title}</p>
              <p className="text-xs text-muted-foreground">{detected[choice.kind] ? 'Wallet detected' : 'Extension not detected'}</p>
            </div>
            {detected[choice.kind] ? <Button disabled={!!working} onClick={() => connect(choice.kind)}>
              {working === choice.kind ? <Loader2 className="h-4 w-4 animate-spin"/> : null} Connect
            </Button> : <a className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" target="_blank" rel="noopener noreferrer" href={choice.url}>
              Get wallet <ExternalLink className="h-3.5 w-3.5"/>
            </a>}
          </div>)}
        </div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">This is a read-only Dogecoin mainnet wallet connection. No DOGE is sent, no message is signed, and no L1 funds are bridged by this feature. Your existing DogeOS wallet and Doge ID remain unchanged.</p>
      </DialogContent>
    </Dialog>
  </>;
};
