import { formatUnits } from 'viem';

/**
 * Formats a wei amount as DOGE using integer math only (no float rounding).
 * Fractions are truncated, never rounded up, so a balance is never overstated.
 */
export function formatDoge(value: bigint, maxFractionDigits = 4): string {
    const raw = formatUnits(value, 18);
    const negative = raw.startsWith('-');
    const [int, frac = ''] = raw.replace('-', '').split('.');
    const intGrouped = BigInt(int).toLocaleString('en-US');
    const fracTrimmed = frac.slice(0, maxFractionDigits).replace(/0+$/, '');
    return `${negative ? '-' : ''}${intGrouped}${fracTrimmed ? `.${fracTrimmed}` : ''}`;
}

/** 0x1234…abcd */
export function shortenAddress(address: string, chars = 4): string {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function formatTimestamp(ms: number): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(ms));
}
