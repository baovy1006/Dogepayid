import { NavLink } from 'react-router-dom';
import { Droplets, ExternalLink } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { DirectWalletButton } from '@/components/wallet/DirectWalletButton';
import { DogeOSSdkConnectButton } from '@/components/wallet/DogeOSSdkConnectButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';

export const TopBar = () => (
  <header className="glass-bar sticky top-0 z-30 border-b border-border/60">
    <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
      <Logo />
      <nav aria-label="Primary" className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/50 p-1 md:flex">
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({isActive}) => cn('interactive rounded-full px-4 py-1.5 text-sm font-medium', isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}>{label}</NavLink>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-2">
        <a href="https://faucet.testnet.dogeos.com/" target="_blank" rel="noopener noreferrer"
          title="Claim free DogeOS testnet DOGE — one claim per 24 hours"
          className="interactive hidden h-9 items-center gap-1.5 rounded-full border border-primary/35 sm:inline-flex bg-primary/10 px-2.5 text-xs font-semibold text-primary hover:bg-primary/20 sm:px-3"
          aria-label="Open official DogeOS testnet faucet in a new tab">
          <Droplets className="h-3.5 w-3.5" aria-hidden /><span>Faucet</span><ExternalLink className="hidden h-3 w-3 sm:block" aria-hidden />
        </a>
        <NotificationBell />
        {import.meta.env.VITE_DOGEOS_CLIENT_ID?.trim() ? <DogeOSSdkConnectButton /> : null}
        <DirectWalletButton />
      </div>
    </div>
  </header>
);