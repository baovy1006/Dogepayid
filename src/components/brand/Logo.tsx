import { Link } from 'react-router-dom';
import { t } from '@/i18n';
import { DogeMark } from './DogeMark';

export const Logo = () => (
    <Link to="/" className="flex items-center gap-2.5 rounded-md" aria-label={`${t.brand.name} home`}>
        <DogeMark className="h-8 w-8" />
        <span className="flex items-baseline gap-1">
            <span className="text-[1.05rem] font-semibold tracking-tight">DogePay</span>
            <span className="font-display text-lg italic text-primary">ID</span>
        </span>
        <span className="ml-1 hidden rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary sm:inline">
            Testnet
        </span>
    </Link>
);
