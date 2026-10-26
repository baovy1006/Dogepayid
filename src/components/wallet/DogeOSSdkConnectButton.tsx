import { useCallback, useEffect, useState } from 'react';
import { useAccount as useDogeAccount, useWalletConnect } from '@dogeos/dogeos-sdk';
import { useAccount as useWagmiAccount, useDisconnect, useSignMessage } from 'wagmi';
import { isAddress, verifyMessage, type Address } from 'viem';
import { Check, Copy, ExternalLink, Loader2, LogOut, ShieldAlert, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { copyToClipboard } from '@/lib/clipboard';
import { shortenAddress } from '@/lib/format';
import { formatDogeId } from '@/lib/dogeId';
import { useDogeIdOf } from '@/hooks/useDogeId';
import { TARGET_CHAIN } from '@/lib/config';
import { identityClient, authConfigured } from '@/lib/identityConnect';

/** Official DogeOS SDK: X social sign-in -> SDK wallet -> synced EVM signer.
 * Never infer that an X login proves ownership of an unrelated MyDoge L1 address.
 * Only a real EVM signer may enable Testnet Pay/Doge ID/Friends via Wagmi.
 */
export const DogeOSSdkConnectButton = () => {
  const {openModal, disconnect, isConnected, isConnecting, error: connectError} = useWalletConnect();
  const sdk = useDogeAccount();
  const wagmi = useWagmiAccount();
  const {disconnectAsync: disconnectEvm} = useDisconnect();
  const {signMessageAsync} = useSignMessage();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mobileAddress, setMobileAddress] = useState('');
  const [provedAddress, setProvedAddress] = useState('');

  const evmAddress = sdk.chainType === 'evm' && sdk.address && isAddress(sdk.address)
    ? sdk.address : null;
  const synced = Boolean(evmAddress && wagmi.isConnected && wagmi.address &&
    evmAddress.toLowerCase() === wagmi.address.toLowerCase());
  const correctChain = synced && wagmi.chainId === TARGET_CHAIN.id;
  const walletVerified = Boolean(synced && provedAddress && provedAddress.toLowerCase() === evmAddress?.toLowerCase());
  const {data: dogeId} = useDogeIdOf(correctChain ? (evmAddress as Address) : undefined);
  const normalizedMobile = mobileAddress.trim();
  const validMobile = isAddress(normalizedMobile);
  const sameAsMobile = validMobile && evmAddress && normalizedMobile.toLowerCase() === evmAddress.toLowerCase();

  useEffect(() => {
    setProvedAddress('');
    setMobileAddress('');
  }, [sdk.address, sdk.chainType]);

  const open = useCallback(() => {setError(''); openModal();}, [openModal]);
  useEffect(() => {
    window.addEventListener('dogepay:open-wallet', open);
    return () => window.removeEventListener('dogepay:open-wallet', open);
  }, [open]);

  const verifyOwnership = async () => {
    if (!correctChain || !evmAddress || busy) return;
    setBusy(true); setError('');
    try {
      const nonce = crypto.randomUUID();
      const message = [
        'DogePay ID Wallet Verification',
        `Domain: ${window.location.host}`,
        `Wallet: ${evmAddress}`,
        `Chain: ${TARGET_CHAIN.id}`,
        `Nonce: ${nonce}`,
        'This signature confirms wallet control only. It does not move DOGE or prove an X identity.'
      ].join('\n');
      const signature = await signMessageAsync({message, account: evmAddress as Address});
      const valid = await verifyMessage({address: evmAddress as Address, message, signature});
      if (!valid) throw new Error('The signature does not match the SDK wallet address.');
      setProvedAddress(evmAddress);
    } catch (e) {setError(e instanceof Error ? e.message : 'Wallet verification failed.');}
    finally {setBusy(false);}
  };

  const logout = async () => {
    if (busy) return;
    setBusy(true); setError('');
    const failures: string[] = [];
    try {await disconnect();} catch {failures.push('DogeOS SDK');}
    if (wagmi.isConnected) {
      try {await disconnectEvm();} catch {failures.push('DogeOS EVM wallet');}
    }
    if (authConfigured) {
      try {
        const {error: authError} = await identityClient().auth.signOut({scope: 'local'});
        if (authError) failures.push('X/Google session');
      } catch {failures.push('X/Google session');}
    }
    if (failures.length) setError(`Could not disconnect: ${failures.join(', ')}. Please retry.`);
    else {
      try {
        for (let i=sessionStorage.length - 1;i>=0;i--) {
          const key = sessionStorage.key(i);
          if (key?.startsWith('dogepay:social:')) sessionStorage.removeItem(key);
        }
      } catch { /* session storage may be restricted */ }
      setProvedAddress(''); setMobileAddress(''); setDetailsOpen(false);
      window.dispatchEvent(new Event('dogepay:account-disconnected'));
    }
    setBusy(false);
  };

  return <div className="flex items-center gap-1.5">
    <Button type="button" size="sm" className="h-10 gap-2 rounded-full px-3"
      onClick={isConnected ? () => setDetailsOpen(true) : open} disabled={busy || isConnecting}>
      <Wallet className="h-4 w-4" />
      <span className="hidden sm:inline">{isConnecting ? 'Connecting...' : isConnected
        ? sdk.address ? shortenAddress(sdk.address) : 'My Wallet' : 'Connect X / Wallet'}</span>
      <span className="sm:hidden">{isConnected ? 'Account' : 'Connect'}</span>
    </Button>
    {isConnected && <Button type="button" variant="outline" size="sm" disabled={busy}
      className="h-9 gap-1 rounded-full border-destructive/40 px-2 text-destructive sm:px-3"
      onClick={() => void logout()} aria-label="Disconnect DogePay account">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <LogOut className="h-3.5 w-3.5"/>}
      <span className="hidden sm:inline">Disconnect</span>
    </Button>}
    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl border-border bg-popover">
        <DialogHeader>
          <DialogTitle>DogePay Account</DialogTitle>
          <DialogDescription>Wallet identity from the official DogeOS SDK. Testnet payments require an EVM signer.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Connected wallet · {sdk.chainType || 'Unknown network'}</p>
            <p className="mt-1 break-all font-mono text-sm">{sdk.address || 'Not connected'}</p>
            {sdk.address && <Button variant="ghost" size="sm" className="mt-1" onClick={() => void copyToClipboard(sdk.address || '', 'Wallet address copied')}>
              <Copy className="h-4 w-4" /> Copy address
            </Button>}
          </div>
          {correctChain ? <div className="flex items-center gap-2 text-sm text-success">
            <ShieldCheck className="h-4 w-4" /> DogeOS Testnet signer ready
          </div> : <div className="flex gap-2 rounded-lg border border-warning/30 p-3 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
            {sdk.chainType === 'dogecoin' ? 'Dogecoin L1 is separate from DogeOS. Select a DogeOS EVM wallet in the SDK for Pay and Doge ID.'
            : synced ? 'Switch the wallet to DogeOS Chikyū Testnet (6281971) to use Pay.'
            : 'A DogeOS EVM wallet is not synchronized with Wagmi yet. Open the SDK wallet picker and connect an EVM wallet.'}
          </div>}
          {dogeId && <p className="text-sm">Your on-chain Doge ID: <strong>{formatDogeId(dogeId)}</strong></p>}
          {correctChain && <Button variant="secondary" className="w-full" disabled={busy || walletVerified}
            onClick={() => void verifyOwnership()}>
            {walletVerified ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {walletVerified ? 'Wallet ownership verified' : 'Verify wallet signature'}
          </Button>}
          <div className="rounded-xl border border-border p-3 space-y-2">
            <p className="text-sm font-semibold">Compare with MyDoge v3 (optional)</p>
            <p className="text-xs text-muted-foreground">Check the DogeOS EVM address shown in MyDoge on your phone. Signing into X does not alone guarantee the same address.</p>
            <Input aria-label="MyDoge v3 DogeOS EVM address" placeholder="0x... address from MyDoge mobile" value={mobileAddress} onChange={e => setMobileAddress(e.target.value)} className="font-mono text-xs" />
            {normalizedMobile && <p role="status" className={`text-xs ${sameAsMobile ? 'text-success' : 'text-warning'}`}>
              {!validMobile ? 'Enter a valid DogeOS EVM address beginning 0x.' : sameAsMobile
                ? 'The two EVM addresses match. You can use this connected signer in DogePay.'
                : 'Different wallets. This SDK session is NOT your MyDoge mobile address.'}
            </p>}
          </div>
          <Button variant="outline" className="w-full" onClick={() => {setDetailsOpen(false);open();}}>Change wallet / Connect X <ExternalLink className="h-4 w-4" /></Button>
          <Button variant="outline" className="w-full border-destructive/40 text-destructive" disabled={busy} onClick={() => void logout()}>Disconnect</Button>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          {connectError && <p role="alert" className="text-xs text-destructive">{String(connectError)}</p>}
        </div>
      </DialogContent>
    </Dialog>
  </div>;
};
