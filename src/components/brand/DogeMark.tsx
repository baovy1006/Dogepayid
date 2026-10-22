import { cn } from '@/lib/utils';

/** DOGE coin mark: the Dogecoin currency sign (Ð) on a gold disc. */
export const DogeMark = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} role="img" aria-label="DOGE">
        <circle cx="16" cy="16" r="15" className="fill-primary" />
        <circle cx="16" cy="16" r="12.5" fill="none" strokeWidth="0.75" className="stroke-primary-foreground/25" />
        <path
            d="M12.5 9.5h3.75a6.5 6.5 0 0 1 0 13H12.5z"
            fill="none"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="stroke-primary-foreground"
        />
        <path d="M9.5 16h7" strokeWidth="2.2" strokeLinecap="round" className="stroke-primary-foreground" />
    </svg>
);
