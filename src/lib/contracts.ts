import type { Abi } from 'viem';
import IdentityRegistryArtifact from '@/abi/IdentityRegistryABI.json';
import SavingsVaultArtifact from '@/abi/SavingsVaultABI.json';

/** The copied files are full Hardhat artifacts — only the `.abi` array is used. */
export const identityRegistryAbi = IdentityRegistryArtifact.abi as Abi;
export const savingsVaultAbi = SavingsVaultArtifact.abi as Abi;
