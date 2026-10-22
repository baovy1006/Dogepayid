import { motion } from 'framer-motion';
import { AtSign, PiggyBank, Send } from 'lucide-react';
import { fadeUp } from '@/lib/motion';

const STEPS = [
    { icon: AtSign, title: 'Claim your Doge ID', body: 'Register one name, tied to your wallet on-chain. Nobody else can claim it for you.' },
    { icon: Send, title: 'Pay by name', body: 'Type a Doge ID, review the resolved address and fee, then sign in your wallet.' },
    { icon: PiggyBank, title: 'Save toward goals', body: 'Set a target and deposit DOGE. No lockups, no yield promises — withdraw anytime.' },
];

export const HowItWorks = () => (
    <section aria-labelledby="how-title">
        <motion.h2 variants={fadeUp} id="how-title" className="eyebrow">How it works</motion.h2>
        <ol className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
                <motion.li key={title} variants={fadeUp} className="bg-card/90 p-6">
                    <div className="flex items-center justify-between">
                        <Icon className="h-5 w-5 text-primary" aria-hidden />
                        <span className="font-display text-2xl text-muted-foreground/60">0{i + 1}</span>
                    </div>
                    <h3 className="mt-6 font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
                </motion.li>
            ))}
        </ol>
    </section>
);
