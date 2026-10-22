import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { WalletButton } from '@/components/wallet/WalletButton';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';

export const TopBar = () => (
    <header className="glass-bar sticky top-0 z-30 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
            <Logo />
            <nav aria-label="Primary" className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/50 p-1 md:flex">
                {NAV_ITEMS.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            cn(
                                'interactive rounded-full px-4 py-1.5 text-sm font-medium',
                                isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                            )
                        }
                    >
                        {label}
                    </NavLink>
                ))}
            </nav>
            <WalletButton />
        </div>
    </header>
);
