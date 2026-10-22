import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';

/** Mobile tab bar. Hidden from md upward where the top bar holds navigation. */
export const BottomNav = () => (
    <nav
        aria-label="Primary"
        className="glass-bar fixed inset-x-0 bottom-0 z-30 border-t border-border/60 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
        <ul className="mx-auto grid max-w-md grid-cols-4">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                    <NavLink
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            cn(
                                'interactive flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                            )
                        }
                    >
                        <Icon className="h-5 w-5" aria-hidden />
                        {label}
                    </NavLink>
                </li>
            ))}
        </ul>
    </nav>
);
