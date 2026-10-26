/** English UI strings. Add sibling files (e.g. es.ts) with the same shape to localize. */
export const en = {
    brand: { name: 'DogePay ID', tagline: 'Send DOGE to people, not just addresses.' },
    nav: { home: 'Home', contacts: 'Contacts', activity: 'Activity', settings: 'Settings' },
    wallet: {
        connect: 'Connect wallet',
        disconnect: 'Disconnect',
        copyAddress: 'Copy address',
        viewOnExplorer: 'View on explorer',
        wrongNetwork: 'Wrong network',
        switchNetwork: 'Switch to DogeOS',
        switching: 'Switching…',
    },
    home: {
        balance: 'Available balance',
        send: 'Send',
        receive: 'Receive',
        request: 'Request',
        soon: 'Soon',
    },
    common: {
        retry: 'Try again',
        testnetNotice: 'Testnet only. DOGE here has no real-world value.',
    },
};

export type Strings = typeof en;
