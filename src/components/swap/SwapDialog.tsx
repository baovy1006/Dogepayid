import {ArrowLeftRight,ExternalLink,ShieldAlert} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
export const SwapDialog=({open,onOpenChange}:{open:boolean;onOpenChange:(v:boolean)=>void})=>(
 <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-md rounded-xl border-border bg-popover">
   <DialogHeader>
    <DialogTitle className="flex items-center gap-2 font-display text-3xl font-normal"><ArrowLeftRight className="h-5 w-5 text-primary"/> Swap</DialogTitle>
    <DialogDescription>Discover token swaps on DogeOS Chikyū Testnet.</DialogDescription>
   </DialogHeader>
   <div className="space-y-4">
    <div className="rounded-xl border border-border bg-background/50 p-4">
     <p className="eyebrow">Swap via an external DEX</p>
     <p className="mt-2 text-sm font-semibold">DOGE ↔ DogeOS testnet tokens</p>
     <p className="mt-1 text-xs text-muted-foreground">Availability depends on live pools, supported token contracts and router liquidity. DogePay has not independently verified all swap pairs.</p>
    </div>
    <p className="flex gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
     <ShieldAlert className="h-4 w-4 shrink-0 text-warning"/>
     External app. Verify chain 6281971, token contract, quote, slippage and approvals before signing. Never send real DOGE to a testnet address.
    </p>
    <a href="https://www.dogeos.com/ecosystem" target="_blank" rel="noopener noreferrer"
       className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 font-semibold text-primary-foreground hover:opacity-90">
      Explore DogeOS swaps <ExternalLink className="h-4 w-4"/>
    </a>
   </div>
  </DialogContent>
 </Dialog>
);