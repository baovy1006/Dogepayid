import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion';
import { BalanceCard } from './BalanceCard';
import { DogeIdCard } from './DogeIdCard';
import { RecentActivity } from './RecentActivity';
import { SavingsSummary } from './SavingsSummary';

export const Dashboard = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-5 md:gap-5">
        <motion.div variants={fadeUp} className="md:col-span-3">
            <BalanceCard />
        </motion.div>
        <div className="grid gap-4 md:col-span-2 md:gap-5">
            <motion.div variants={fadeUp}>
                <DogeIdCard />
            </motion.div>
            <motion.div variants={fadeUp}>
                <SavingsSummary />
            </motion.div>
        </div>
        <motion.div variants={fadeUp} className="md:col-span-5">
            <RecentActivity limit={5} />
        </motion.div>
    </motion.div>
);
