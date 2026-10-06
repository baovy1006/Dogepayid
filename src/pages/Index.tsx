import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const Index = () => {
    const { isConnected } = useAccount();

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top navbar */}
            <header className="flex items-center justify-end px-4 py-4">
                {/* Connect / account / wrong-network button. Only TARGET_CHAIN is configured. */}
                <ConnectButton chainStatus="icon" showBalance />
            </header>

            {/* Centered content */}
            <main className="flex-1 flex flex-col items-center justify-center">
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 400, color: '#3a3a3a', letterSpacing: '0.01em', textAlign: 'center' }}>
                    Start building your app
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 300, color: '#6b6b6b', textAlign: 'center' }}>
                    {isConnected ? 'Your wallet is connected' : 'Connect your wallet to get started'}
                </p>
            </main>
        </div>
    );
};

export default Index;
