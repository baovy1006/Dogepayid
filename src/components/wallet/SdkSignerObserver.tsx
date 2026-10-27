import { useEffect } from 'react';
import { useAccount as useDogeAccount, useWalletConnect } from '@dogeos/dogeos-sdk';
import { useAccount as useWagmiAccount } from 'wagmi';
import { isAddress } from 'viem';
import { setSdkSignerSession, type EvmSdkProvider } from '@/lib/sdkSignerBridge';

/** No UI and no automatic signature. Tracks a verified address-matching SDK EVM provider. */
export const SdkSignerObserver = () => {
  const sdk = useDogeAccount();
  const wallet = useWalletConnect();
  const wagmi = useWagmiAccount();
  useEffect(() => {
    const address = sdk.address;
    if (wallet.isConnected && sdk.chainType === 'evm' && address && isAddress(address) &&
        wagmi.isConnected && wagmi.address?.toLowerCase() === address.toLowerCase() &&
        sdk.currentProvider && typeof sdk.currentProvider.request === 'function') {
      setSdkSignerSession({ address, provider: sdk.currentProvider as unknown as EvmSdkProvider });
    } else {
      setSdkSignerSession(null);
    }
    return () => setSdkSignerSession(null);
  }, [wallet.isConnected, sdk.address, sdk.chainType, sdk.currentProvider, wagmi.isConnected, wagmi.address]);
  return null;
};
