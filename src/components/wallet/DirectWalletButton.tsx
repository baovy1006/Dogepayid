import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Loader2, LogOut, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/format';
import { toast } from '@/hooks/use-toast';

/** Independent DogeOS EVM wallet path: works even if the MyDoge social relay fails.
 * No OAuth, no second identity, no auto-signing, no wallet generation.
 */
const DirectWalletControls = ({
  mounted, openConnectModal, openAccountModal,
}: {
  mounted: boolean;
  openConnectModal?: () => void;
  openAccountModal?: () => void;
}) => {
  const { address, isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const open = () => {
      if (isConnected) openAccountModal?.();
      else openConnectModal?.();
    };
    window.addEventListener('dogepay:open-wallet', open);
    return () => window.removeEventListener('dogepay:open-wallet', open);
  }, [isConnected, openAccountModal, openConnectModal]);

  const disconnectWallet = async () => {
    if (busy || !isConnected) return;
    setBusy(true);
    try {
      await disconnectAsync();
      // Social session (if any) is intentionally managed by the X account control.
      window.dispatchEvent(new Event('dogepay:account-disconnected'));
    } catch (e) {
      toast({ title: 'Could not disconnect wallet', description: e instanceof Error ? e.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return <div className="flex items-center gap-1">
    <Button type="button" size="sm" variant="outline"
      className="h-10 gap-1.5 rounded-full border-border/90 bg-secondary/70 px-2 text-foreground shadow-sm shadow-black/10 transition-colors hover:border-primary/55 hover:bg-secondary hover:text-foreground focus-visible:ring-primary sm:px-3"
      style={{color: 'hsl(var(--foreground))'}}
      aria-label={isConnected ? 'Manage DogeOS wallet' : 'Connect DogeOS EVM wallet'}
      disabled={!mounted || busy || (!isConnected && !openConnectModal)}
      onClick={() => { if (isConnected) openAccountModal?.(); else openConnectModal?.(); }}>
      <Wallet className="h-4 w-4 text-foreground" style={{color: 'hsl(var(--foreground))'}} aria-hidden />
      <span className="hidden sm:inline text-foreground" style={{color: 'hsl(var(--foreground))'}}>{isConnected && address ? shortenAddress(address) : 'Connect Wallet'}</span>
      <span className="sm:hidden text-foreground" style={{color: 'hsl(var(--foreground))'}}>Wallet</span>
    </Button>
    {isConnected && <Button type="button" size="sm" variant="ghost" className="h-10 w-8 p-0 text-destructive"
      aria-label="Disconnect DogeOS wallet" disabled={busy} onClick={() => void disconnectWallet()}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
    </Button>}
  </div>;
};

export const DirectWalletButton = () => <ConnectButton.Custom>
  {({ mounted, openConnectModal, openAccountModal }) =>
    <DirectWalletControls mounted={mounted} openConnectModal={openConnectModal} openAccountModal={openAccountModal} />}
</ConnectButton.Custom>;
