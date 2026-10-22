import { Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';

export const CopyIcon = ({ value, label }: { value: string; label: string }) => (
    <button
        onClick={() => copyToClipboard(value, `${label} copied`)}
        className="interactive shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label={`Copy ${label}`}
    >
        <Copy className="h-3.5 w-3.5" aria-hidden />
    </button>
);
