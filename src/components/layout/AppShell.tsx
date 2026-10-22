import { MotionConfig } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NetworkBanner } from '@/components/wallet/NetworkBanner';
import { WalletEvents } from '@/components/wallet/WalletEvents';
import { t } from '@/i18n';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

export const AppShell = () => (
    <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={200}>
            <div className="app-bg relative min-h-screen">
                <div className="grain" aria-hidden />
                <WalletEvents />
                <TopBar />
                <NetworkBanner />
                <main className="relative z-10 mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-16 md:pt-10">
                    <Outlet />
                </main>
                <footer className="relative z-10 mx-auto hidden max-w-5xl px-4 pb-8 text-xs text-muted-foreground md:block">
                    {t.common.testnetNotice} DogePay never asks for your seed phrase or private key.
                </footer>
                <BottomNav />
            </div>
        </TooltipProvider>
    </MotionConfig>
);
