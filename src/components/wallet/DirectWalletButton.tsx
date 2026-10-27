import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount as useDogeAccount, useWalletConnect } from '@dogeos/dogeos-sdk';
import { useAccount, useDisconnect } from 'wagmi';
import { ChevronDown, Copy, Link2, Loader2, LogOut, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { shortenAddress } from '@/lib/format';
import { copyToClipboard } from '@/lib/clipboard';
import { toast } from '@/hooks/use-toast';

/** Direct EVM wallet connection is independent from X/Google OAuth. */
const WalletControls = ({
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
    const open = () => isConnected ? openAccountModal?.() : openConnectModal?.();
    window.addEventListener('dogepay:open-wallet', open);
    return () => window.removeEventListener('dogepay:open-wallet', open);
  }, [isConnected, openAccountModal, openConnectModal]);

  const disconnectWallet = async () => {
    if (busy || !isConnected) return;
    setBusy(true);
    try {
      await disconnectAsync();
      window.dispatchEvent(new Event('dogepay:account-disconnected'));
    } catch (e) {
      toast({ title: 'Could not disconnect wallet', description: e instanceof Error ? e.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (!isConnected) return <Button type="button" size="sm" variant="outline"
    className="h-10 gap-1.5 rounded-full border-border/90 bg-secondary/70 px-3 text-foreground hover:border-primary/55 hover:bg-secondary hover:text-foreground"
    aria-label="Connect DogeOS EVM wallet" disabled={!mounted || busy || !openConnectModal}
    onClick={() => openConnectModal?.()}>
    <Wallet className="h-4 w-4" aria-hidden />
    <span className="hidden sm:inline">Connect Wallet</span><span className="sm:hidden">Wallet</span>
  </Button>;

  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button type="button" size="sm" variant="outline"
        className="h-10 gap-1.5 rounded-full border-border/90 bg-secondary/75 px-3 text-foreground hover:border-primary/55 hover:bg-secondary hover:text-foreground"
        aria-label="Open DogePay account menu" disabled={!mounted || busy}>
        <Wallet className="h-4 w-4" aria-hidden />
        <span className="font-mono text-xs text-foreground">{address ? shortenAddress(address) : 'My Wallet'}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="z-[70] w-64 border-border bg-popover p-2 text-popover-foreground">
      <DropdownMenuLabel className="text-xs text-muted-foreground">DogeOS EVM Wallet</DropdownMenuLabel>
      <p className="break-all px-2 pb-2 font-mono text-xs text-foreground">{address ?? 'No wallet'}</p>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => { if (address) void copyToClipboard(address, 'Wallet address copied'); }}>
        <Copy className="h-4 w-4" /> Copy address
      </DropdownMenuItem>
      {import.meta.env.VITE_DOGEOS_CLIENT_ID?.trim() && <DropdownMenuItem onSelect={() => window.dispatchEvent(new Event('dogepay:open-x'))}>
        <Link2 className="h-4 w-4" /> Connect X / Google
      </DropdownMenuItem>}
      <DropdownMenuItem onSelect={() => openAccountModal?.()}>
        <Wallet className="h-4 w-4" /> Wallet details
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive" disabled={busy} onSelect={() => void disconnectWallet()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Disconnect
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
};

const DirectWalletInner = () => <ConnectButton.Custom>
  {({ mounted, openConnectModal, openAccountModal }) =>
    <WalletControls mounted={mounted} openConnectModal={openConnectModal} openAccountModal={openAccountModal} />}
</ConnectButton.Custom>;

const DirectWalletWhenSdkActive = () => {
  const { isConnected: sdkConnected } = useWalletConnect();
  const sdk = useDogeAccount();
  const wagmi = useAccount();
  const sameEvmWallet = sdkConnected && sdk.chainType === 'evm' && !!sdk.address && !!wagmi.address &&
    sdk.address.toLowerCase() === wagmi.address.toLowerCase();
  return sameEvmWallet ? null : <DirectWalletInner />;
};

/** Never call SDK hooks outside WalletConnectProvider. */
export const DirectWalletButton = () =>
  import.meta.env.VITE_DOGEOS_CLIENT_ID?.trim() ? <DirectWalletWhenSdkActive /> : <DirectWalletInner />;
