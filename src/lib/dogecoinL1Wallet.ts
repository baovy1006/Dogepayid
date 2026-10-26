/** Dogecoin L1 connection layer. Never shares a signer with DogeOS (EVM). */
export type DogecoinWalletKind = 'mydoge' | 'dogesoft';
export type DogecoinL1Session = {
  kind: DogecoinWalletKind;
  address: string;
  balanceDoge: string | null;
};

type MyDogeProvider = {
  isMyDoge?: boolean;
  connect: () => Promise<{ approved?: boolean; address?: string }>;
  disconnect?: () => Promise<{ disconnected?: boolean } | void>;
  getBalance?: () => Promise<{ balance: number | string }>;
};

type DogeSoftProvider = {
  isDogeSoft?: boolean;
  network?: string;
  connect: () => Promise<{ address?: string; accounts?: string[] }>;
  isConnected: () => boolean;
  getAccounts: () => Promise<string[]>;
  getBalance: () => Promise<{ balance?: number | string; balanceDoge?: number | string }>;
  disconnect: () => Promise<unknown>;
};

declare global {
  interface Window {
    doge?: MyDogeProvider;
    dogesoft?: DogeSoftProvider;
  }
}

export const dogecoinWalletAvailable = (kind: DogecoinWalletKind): boolean => {
  if (typeof window === 'undefined') return false;
  return kind === 'mydoge' ? !!window.doge?.isMyDoge : !!window.dogesoft?.isDogeSoft;
};

function validL1Address(address: unknown): string {
  if (typeof address !== 'string' ||
      !/^[DA9][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{25,44}$/.test(address) ||
      address.startsWith('0x')) {
    throw new Error('Wallet did not return a valid Dogecoin L1 address.');
  }
  return address;
}

/** MyDoge's browser extension reports atomic koinu (1 DOGE = 10^8 koinu). */
function koinuToDoge(value: number | string): string | null {
  const text = String(value);
  if (!/^\d+$/.test(text)) return null;
  try {
    const amount = BigInt(text);
    const whole = amount / 100000000n;
    const fraction = (amount % 100000000n).toString().padStart(8, '0').replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole.toString();
  } catch { return null; }
}

function dogeSoftBalance(value: number | string | undefined): string | null {
  if (value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number.toFixed(8).replace(/\.?0+$/, '') || '0' : null;
}

export async function connectDogecoinWallet(kind: DogecoinWalletKind): Promise<DogecoinL1Session> {
  if (typeof window === 'undefined') throw new Error('Browser wallet unavailable.');
  if (kind === 'mydoge') {
    const wallet = window.doge;
    if (!wallet?.isMyDoge) throw new Error('MyDoge browser extension is not detected.');
    const result = await wallet.connect(); // Only called on a user click.
    if (!result.approved) throw new Error('MyDoge connection was not approved.');
    const address = validL1Address(result.address);
    let balanceDoge: string | null = null;
    try { if (wallet.getBalance) balanceDoge = koinuToDoge((await wallet.getBalance()).balance); } catch { /* account still connected */ }
    return { kind, address, balanceDoge };
  }
  const wallet = window.dogesoft;
  if (!wallet?.isDogeSoft) throw new Error('Doge Soft browser wallet is not detected.');
  if (wallet.network && wallet.network !== 'mainnet') throw new Error('The connected Doge Soft wallet must be on Dogecoin mainnet.');
  const result = await wallet.connect(); // Explicit user approval.
  const address = validL1Address(result.address || result.accounts?.[0]);
  let balanceDoge: string | null = null;
  try {
    const current = await wallet.getBalance();
    balanceDoge = dogeSoftBalance(current.balanceDoge ?? current.balance);
  } catch { /* balance read failure is not a connect failure */ }
  return { kind, address, balanceDoge };
}

/** Rehydrate only an already-approved Doge Soft connection; never prompt on page load. */
export async function restoreDogecoinWallet(): Promise<DogecoinL1Session | null> {
  if (typeof window === 'undefined' || !window.dogesoft?.isDogeSoft) return null;
  const wallet = window.dogesoft;
  try {
    if (!wallet.isConnected() || (wallet.network && wallet.network !== 'mainnet')) return null;
    const accounts = await wallet.getAccounts();
    const address = validL1Address(accounts[0]);
    let balanceDoge: string | null = null;
    try {
      const current = await wallet.getBalance();
      balanceDoge = dogeSoftBalance(current.balanceDoge ?? current.balance);
    } catch { /* show address without balance */ }
    return { kind: 'dogesoft', address, balanceDoge };
  } catch { return null; }
}

export async function disconnectDogecoinWallet(kind: DogecoinWalletKind): Promise<void> {
  if (typeof window === 'undefined') return;
  if (kind === 'mydoge') await window.doge?.disconnect?.();
  else await window.dogesoft?.disconnect();
}
