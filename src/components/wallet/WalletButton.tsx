import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Home/Settings/ConnectGate delegate to the ONE top-bar wallet workflow. */
export const WalletButton = ({ size = 'default', className }: {
  size?: 'default' | 'lg'; className?: string;
}) => <Button type="button" size={size} className={cn('gap-2 rounded-full', className)}
  onClick={() => window.dispatchEvent(new Event('dogepay:open-wallet'))}>
    <Wallet className="h-4 w-4" /> Connect Wallet
  </Button>;
