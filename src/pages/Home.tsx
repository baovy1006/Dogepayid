import { useAccount } from 'wagmi';
import { ConnectHero } from '@/components/home/ConnectHero';
import { Dashboard } from '@/components/home/Dashboard';

const Home = () => {
    const { isConnected } = useAccount();
    return isConnected ? <Dashboard /> : <ConnectHero />;
};

export default Home;
