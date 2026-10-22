import { parseUnits } from 'viem';

/**
 * Parses a user-typed DOGE amount into wei with integer math.
 * Returns null for empty, malformed, zero, negative, or >18-decimal input.
 */
export function parseDogeAmount(input: string): bigint | null {
    const value = input.trim();
    if (!/^\d+(\.\d{0,18})?$/.test(value) && !/^\.\d{1,18}$/.test(value)) return null;
    try {
        const wei = parseUnits(value.startsWith('.') ? `0${value}` : value, 18);
        return wei > 0n ? wei : null;
    } catch {
        return null;
    }
}

/** Keeps only characters valid in a decimal DOGE amount while typing. */
export const sanitizeAmountInput = (input: string) => input.replace(/,/g, '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
