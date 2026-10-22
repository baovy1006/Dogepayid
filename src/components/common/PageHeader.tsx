import type { ReactNode } from 'react';

export const PageHeader = ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
        <div>
            <h1 className="font-display text-4xl leading-none tracking-tight md:text-5xl">{title}</h1>
            {description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
    </div>
);
