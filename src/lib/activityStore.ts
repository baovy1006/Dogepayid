/**
 * Device-local cache of transactions submitted through DogePay.
 * Every record is keyed by a real transaction hash; its status is only ever set
 * from an on-chain receipt. Nothing here is fabricated or used to compute balances.
 */
export type ActivityKind = 'send' | 'register_id' | 'savings_deposit' | 'savings_withdraw' | 'savings_create';
export type ActivityStatus = 'pending' | 'confirmed' | 'failed';

export interface ActivityRecord {
    hash: `0x${string}`;
    kind: ActivityKind;
    status: ActivityStatus;
    chainId: number;
    amountWei?: string;
    counterparty?: { address: string; dogeId?: string };
    /** Block timestamp (ms) once confirmed; submit time while pending. */
    timestamp: number;
}

const PREFIX = 'dogepay:';
const EVENT = 'dogepay:activity';
const keyFor = (owner: string) => `${PREFIX}activity:${owner.toLowerCase()}`;

export function loadActivity(owner: string): ActivityRecord[] {
    try {
        const raw = localStorage.getItem(keyFor(owner));
        const list = raw ? (JSON.parse(raw) as ActivityRecord[]) : [];
        return list.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
        return [];
    }
}

export function upsertActivity(owner: string, record: ActivityRecord): void {
    const list = loadActivity(owner).filter((r) => r.hash !== record.hash);
    localStorage.setItem(keyFor(owner), JSON.stringify([record, ...list].slice(0, 200)));
    window.dispatchEvent(new Event(EVENT));
}

export function subscribeActivity(cb: () => void): () => void {
    window.addEventListener(EVENT, cb);
    window.addEventListener('storage', cb);
    return () => {
        window.removeEventListener(EVENT, cb);
        window.removeEventListener('storage', cb);
    };
}

/** Removes every DogePay key from this device (activity, contacts, preferences). */
export function clearLocalData(): void {
    Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new Event(EVENT));
}
