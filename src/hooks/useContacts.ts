import { useEffect, useState } from 'react';
import { loadContacts, subscribeContacts, type Contact } from '@/lib/contactsStore';

/** Saved contacts for the connected wallet on this device. */
export function useContacts(owner?: string): Contact[] {
    const [contacts, setContacts] = useState<Contact[]>(() => (owner ? loadContacts(owner) : []));
    useEffect(() => {
        if (!owner) return setContacts([]);
        const refresh = () => setContacts(loadContacts(owner));
        refresh();
        return subscribeContacts(refresh);
    }, [owner]);
    return contacts;
}
