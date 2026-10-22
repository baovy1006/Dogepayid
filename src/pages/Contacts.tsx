import { Search, Smartphone, Users } from 'lucide-react';
import { ConnectGate } from '@/components/common/ConnectGate';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/ui/input';
import { CONTRACTS } from '@/lib/config';

const Contacts = () => {
    const registryLive = !!CONTRACTS.identityRegistry;

    return (
        <>
            <PageHeader title="Contacts" description="Find people by Doge ID and save favorites for faster payments." />
            <ConnectGate reason="Connect to search Doge IDs and manage your saved contacts.">
                <div className="glass-card p-6">
                    <label htmlFor="contact-search" className="sr-only">Search Doge IDs</label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <Input
                            id="contact-search"
                            disabled={!registryLive}
                            placeholder={registryLive ? 'Search @name.doge' : 'Search opens once the Doge ID registry is live'}
                            className="h-12 rounded-full border-border bg-background/60 pl-10"
                        />
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Smartphone className="h-3.5 w-3.5" aria-hidden />
                        Saved contacts are stored on this device only and are not synced.
                    </p>
                    <EmptyState icon={Users} title="No saved contacts" description="People you save will appear here, with their verified wallet address." />
                </div>
            </ConnectGate>
        </>
    );
};

export default Contacts;
