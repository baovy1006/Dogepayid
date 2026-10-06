import { formatEther, isAddress } from 'viem';
import { getBalance } from 'wagmi/actions';
import { TARGET_CHAIN } from './config';
import { wagmiConfig } from './wagmi';

export function formatTokenAmount(amount: string | number, precision: number = 18): string {
  if (
    typeof amount !== 'number' && typeof amount !== 'string'
  ) {
    return '0';
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) {
    return '0';
  }
  try {
    const amountStr = num.toString();
    if (amountStr.indexOf('.') === -1) {
      return amountStr;
    }
    const decimals = amountStr.split('.')?.[1]?.length || 0;
    if (decimals > precision) {
      if (precision === undefined || Number.isNaN(precision)) {
        return (Math.floor(num * Math.pow(10, 18)) / Math.pow(10, 18))
          .toFixed(18)
          .replace(/\.?0+$/, '');
      }
      return (
        Math.floor(num * Math.pow(10, precision)) / Math.pow(10, precision)
      ).toFixed(precision);
    }
    return amountStr;
  } catch (err) {
    return '0';
  }
}

export const scientificToDecimal = (num: string | number): string => {
  const numStr = typeof num === 'number' ? num.toString() : num;
  if (!/e/i.test(numStr)) {
    return numStr;
  }
  const [base, exponent] = numStr.split(/e/i);
  if (exponent) {
    const e = parseInt(exponent, 10);
    if (e < 0) {
      return '0.' + '0'.repeat(Math.abs(e) - 1) + base.replace('.', '');
    }
  }
  return numStr;
};

export const getNativeTokenBalance = async (walletAddress: string, chainId?: number): Promise<string> => {
  try {
    const targetChainId = chainId || TARGET_CHAIN.id;
    if (targetChainId !== TARGET_CHAIN.id) {
      return '0';
    }

    if (!isValidAddress(walletAddress)) {
      return '0';
    }

    // Read via the chain's RPC, independent of which chain the wallet is on.
    const { value } = await getBalance(wagmiConfig, { address: walletAddress, chainId: TARGET_CHAIN.id });
    return formatEther(value);
  } catch (error) {
    return '0';
  }
};

export const isValidAddress = (address: string): address is `0x${string}` => {
  try {
    return isAddress(address, { strict: false });
  } catch {
    return false;
  }
};

export default {
  isValidAddress,
  getNativeTokenBalance,
  formatTokenAmount,
  scientificToDecimal,
};