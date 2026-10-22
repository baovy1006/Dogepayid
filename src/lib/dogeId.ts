/**
 * Doge ID name rules — mirrors IdentityRegistry.isValidName exactly:
 * 3–20 chars, a-z 0-9 and '-', no leading/trailing hyphen, no '--'.
 */
export const NAME_MIN = 3;
export const NAME_MAX = 20;
export const NAME_RULES = 'Lowercase letters, numbers and single hyphens. 3–20 characters.';

/** "@Alex.doge " → "alex". Uppercase is folded so on-chain lookups are consistent. */
export function normalizeName(input: string): string {
    return input.trim().toLowerCase().replace(/^@/, '').replace(/\.doge$/, '');
}

/** Returns a human-readable problem, or null when the (normalized) name is valid. */
export function nameProblem(name: string): string | null {
    if (name.length < NAME_MIN) return `At least ${NAME_MIN} characters.`;
    if (name.length > NAME_MAX) return `At most ${NAME_MAX} characters.`;
    if (!/^[a-z0-9-]+$/.test(name)) return 'Only a–z, 0–9 and hyphens are allowed.';
    if (name.startsWith('-') || name.endsWith('-')) return 'Cannot start or end with a hyphen.';
    if (name.includes('--')) return 'No double hyphens.';
    return null;
}

export const isValidName = (name: string) => nameProblem(name) === null;

export const formatDogeId = (name: string) => `@${name}.doge`;
