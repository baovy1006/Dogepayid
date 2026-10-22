import { Activity, Home, Settings, Users, type LucideIcon } from 'lucide-react';
import { t } from '@/i18n';

export interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
    { to: '/', label: t.nav.home, icon: Home },
    { to: '/contacts', label: t.nav.contacts, icon: Users },
    { to: '/activity', label: t.nav.activity, icon: Activity },
    { to: '/settings', label: t.nav.settings, icon: Settings },
];
