import { TARGET_CHAIN } from './config';
import { parseDogeAmount } from './amount';
import { nameProblem, normalizeName } from './dogeId';

/**
 * Shareable payment request: /pay?to=<name>&amount=<DOGE>&chain=<id>.
 * A request moves no funds — the payer reviews and signs a normal transfer.
 */
export interface PaymentRequest {
    name: string;
    amount: string;
    amountWei: bigint;
}

export function buildRequestUrl(name: string, amount: string): string {
    const params = new URLSearchParams({ to: name, amount, chain: String(TARGET_CHAIN.id) });
    return `${window.location.origin}/pay?${params.toString()}`;
}

/** Validates every parameter; returns the request or a human-readable reason it's invalid. */
export function parseRequest(params: URLSearchParams): { request?: PaymentRequest; error?: string } {
    const chain = Number(params.get('chain'));
    if (chain !== TARGET_CHAIN.id) return { error: `This request is for a different network (chain ${params.get('chain') ?? 'missing'}). DogePay only supports ${TARGET_CHAIN.name}.` };
    const name = normalizeName(params.get('to') ?? '');
    const problem = nameProblem(name);
    if (problem) return { error: 'The recipient Doge ID in this request is invalid.' };
    const amount = (params.get('amount') ?? '').trim();
    const amountWei = parseDogeAmount(amount);
    if (!amountWei) return { error: 'The amount in this request is invalid.' };
    return { request: { name, amount, amountWei } };
}
