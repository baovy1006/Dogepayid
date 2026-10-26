import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { WalletButton } from '@/components/wallet/WalletButton';
import { fadeUp, stagger } from '@/lib/motion';
import { HeroPreview } from './HeroPreview';
import { HowItWorks } from './HowItWorks';

export const ConnectHero = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-16 md:space-y-24">
        <section className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr] md:gap-12">
            <div>
                <motion.p variants={fadeUp} className="eyebrow">Social payments on DogeOS Testnet</motion.p>
                <motion.h1 variants={fadeUp} className="mt-4 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
                    Send DOGE to <em className="text-primary">people</em>, not just addresses.
                </motion.h1>
                <motion.p variants={fadeUp} className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
                    Claim a name like <span className="font-medium text-foreground">@alex.doge</span>, pay friends by name, and set DOGE aside
                    toward goals you can withdraw anytime.
                </motion.p>
                <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <WalletButton size="lg" />
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
                        Non-custodial. Your wallet signs everything.
                    </p>
                </motion.div>
            </div>
            <motion.div variants={fadeUp}>
                <HeroPreview />
            </motion.div>
        </section>
        <HowItWorks />
    </motion.div>
);
