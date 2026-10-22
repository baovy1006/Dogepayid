import { toast } from '@/hooks/use-toast';

export async function copyToClipboard(text: string, label = 'Copied'): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
        toast({ title: label, description: 'Copied to your clipboard.' });
    } catch {
        toast({ title: 'Copy failed', description: 'Select and copy the text manually.', variant: 'destructive' });
    }
}
