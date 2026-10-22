/**
 * Device-local saved contacts. Not synced anywhere and not a social graph.
 * The stored address is only for display — the Send flow always re-resolves the
 * Doge ID on-chain before signing.
 */
export interface Contact {
    name: string;
    address: string;
    savedAt: number;
}

const EVENT = 'dogepay:contacts';
const keyFor = (owner: string) => `dogepay:contacts:${owner.toLowerCase()}`;

export function loadContacts(owner: string): Contact[] {
    try {
        const raw = localStorage.getItem(keyFor(owner));
        return raw ? (JSON.parse(raw) as Contact[]) : [];
    } catch {
        return [];
    }
}

function save(owner: string, list: Contact[]) {
    localStorage.setItem(keyFor(owner), JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT));
}

export function addContact(owner: string, contact: Omit<Contact, 'savedAt'>) {
    const list = loadContacts(owner).filter((c) => c.name !== contact.name);
    save(owner, [{ ...contact, savedAt: Date.now() }, ...list]);
}

export function removeContact(owner: string, name: string) {
    save(owner, loadContacts(owner).filter((c) => c.name !== name));
}

export function subscribeContacts(cb: () => void): () => void {
    window.addEventListener(EVENT, cb);
    window.addEventListener('storage', cb);
    return () => {
        window.removeEventListener(EVENT, cb);
        window.removeEventListener('storage', cb);
    };
}
