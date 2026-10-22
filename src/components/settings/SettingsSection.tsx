import type { ReactNode } from 'react';

export const SettingsSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="glass-card p-6" aria-label={title}>
        <h2 className="eyebrow">{title}</h2>
        <dl className="mt-3 divide-y divide-border">{children}</dl>
    </section>
);

interface SettingRowProps {
    label: string;
    value: ReactNode;
    mono?: boolean;
    action?: ReactNode;
}

export const SettingRow = ({ label, value, mono, action }: SettingRowProps) => (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className={`flex min-w-0 items-center gap-2 text-sm ${mono ? 'font-mono text-xs' : ''}`}>
            <span className="break-all">{value}</span>
            {action}
        </dd>
    </div>
);
