import { encodeFunctionData, zeroAddress, type Address, type Hash } from 'viem';
import { getAccount, getPublicClient, readContract, writeContract } from 'wagmi/actions';
import { CONTRACTS, TARGET_CHAIN } from './config';
import { identityRegistryAbi } from './contracts';
import { isValidName } from './dogeId';
import { wagmiConfig } from './wagmi';
import { sdkSignerFor, sendThroughSdkProvider } from './sdkSignerBridge';

/** IdentityRegistry reads/writes. Names passed here must already be normalized. */
function registry(): Address {
    if (!CONTRACTS.identityRegistry) throw new Error('Doge ID registry is not deployed.');
    return CONTRACTS.identityRegistry;
}

const read = <T>(functionName: string, args: unknown[]) =>
    readContract(wagmiConfig, { address: registry(), abi: identityRegistryAbi, functionName, args, chainId: TARGET_CHAIN.id }) as Promise<T>;

/** Owner wallet of a Doge ID, or null when unregistered. */
export async function resolveName(name: string): Promise<Address | null> {
    if (!isValidName(name)) return null;
    const owner = await read<Address>('resolve', [name]);
    return owner && owner !== zeroAddress ? owner : null;
}

/** Doge ID registered by a wallet, or null. */
export async function nameOf(owner: Address): Promise<string | null> {
    const name = await read<string>('nameOf', [owner]);
    return name || null;
}

export const isNameAvailable = (name: string) => read<boolean>('isAvailable', [name]);

/**
 * Self-registration requires a real signature by the connected EVM account.
 * All preflight reads use the trusted DogeOS Chikyu RPC before opening the
 * DogeOS SDK wallet confirmation dialog. No keys or signatures leave the wallet.
 * Supplying gas and EIP-1559 fee fields may avoid SDK fee-estimation hangs;
 * some wallet implementations may still re-estimate internally.
 */
export async function registerName(name: string): Promise<Hash> {
    if (!isValidName(name)) throw new Error('Invalid Doge ID. Use 3–20 lowercase characters, digits or single hyphens.');
    const account = getAccount(wagmiConfig);
    if (!account.isConnected || !account.address) throw new Error('Connect a DogeOS EVM wallet before registering.');
    if (account.chainId !== TARGET_CHAIN.id) throw new Error('Switch to DogeOS Chikyu Testnet (6281971) first.');
    const c = getPublicClient(wagmiConfig, {chainId: TARGET_CHAIN.id});
    if (!c) throw new Error('DogeOS Testnet RPC is unavailable. Please retry when the network responds.');
    const address = registry();
    const owner = account.address;

    // The registered name can change while a user is on the form. Confirm both
    // one-name-per-wallet and global availability immediately before signing.
    const [existingName, available] = await Promise.all([
        c.readContract({address, abi: identityRegistryAbi, functionName: 'nameOf', args: [owner]}),
        c.readContract({address, abi: identityRegistryAbi, functionName: 'isAvailable', args: [name]}),
    ]);
    if (typeof existingName === 'string' && existingName.length > 0)
        throw new Error(`This wallet has already registered @${existingName}.doge.`);
    if (available !== true) throw new Error(`@${name}.doge is no longer available. Choose another name.`);

    // SDK Social Wallet uses the EIP-1193 provider directly with legacy gasPrice.
    // Keep the existing Wagmi/EIP-1559 contract path intact for MetaMask.
    if (sdkSignerFor(owner)) {
        const [estimate, gasPrice, balance] = await Promise.all([
            c.estimateContractGas({address, abi: identityRegistryAbi, functionName: 'register', args: [name], account: owner}),
            c.getGasPrice(),
            c.getBalance({address: owner}),
        ]);
        const gas = (estimate * 120n + 99n) / 100n;
        if (gasPrice <= 0n || gas * gasPrice > balance)
            throw new Error('Not enough Testnet DOGE or no network gas price. Registration not submitted.');
        return sendThroughSdkProvider({
            from: owner, to: address, value: 0n, gas, gasPrice,
            data: encodeFunctionData({abi: identityRegistryAbi, functionName: 'register', args: [name]}),
        });
    }
    // Estimate this exact contract invocation (not a 21,000-gas DOGE transfer).
    const [estimate, fees, balance] = await Promise.all([
        c.estimateContractGas({address, abi: identityRegistryAbi, functionName: 'register', args: [name], account: owner}),
        c.estimateFeesPerGas({type: 'eip1559'}),
        c.getBalance({address: owner}),
    ]);
    const gas = (estimate * 120n + 99n) / 100n;
    const {maxFeePerGas, maxPriorityFeePerGas} = fees;
    if (maxFeePerGas === undefined || maxPriorityFeePerGas === undefined)
        throw new Error('DogeOS RPC could not provide a transaction fee quote. No wallet request was made.');
    if (gas * maxFeePerGas > balance)
        throw new Error('Not enough Testnet DOGE for registration gas. Claim DOGE from the testnet faucet.');

    // The wallet still asks for explicit user approval; no transaction is
    // broadcast automatically by this function.
    return writeContract(wagmiConfig, {
        address,
        abi: identityRegistryAbi,
        functionName: 'register',
        args: [name],
        chainId: TARGET_CHAIN.id,
        gas,
        maxFeePerGas,
        maxPriorityFeePerGas,
    });
}
