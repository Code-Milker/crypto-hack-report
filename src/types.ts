import { z } from 'zod';
export const transactionSchema = z.object({
  hash: z.string().length(66, 'Invalid transaction hash'), // Transaction hash
  to: z.string(), // "to" can be null for contract creation transactions
  from: z.string(), // "from" is always a valid Ethereum address
  value: z.bigint(), // The value transferred in the transaction (in wei as a string)
  gasPrice: z.bigint(), // Gas price in wei (as a string)
  gasLimit: z.bigint(), // Gas limit (as a string)
  nonce: z.number().min(0), // Transaction nonce, non-negative integer
  blockNumber: z.number().nullable(), // Can be null if the transaction is not mined yet
  chainId: z.bigint(), // The chain ID where the transaction took place
});

export interface TransactionPathFromAttack extends TransactionContext {
  nextTransactions: TransactionPathFromAttack[] | TokenTransactionContext[];
}

export interface TransactionContext {
  to: string;
  from: string;
  timeStamp: string;
  blockNumber: number;
  ensName?: string; // Optional if ENS is not available
  amount: string;
  transactionHash: string;
}
export interface TokenTransactionContext extends TransactionContext {
  tokenContractAddress: string;
}
export interface TransactionContextPath extends TransactionContext {
  nextTransactions: TransactionContextPath[];
}
export interface RawTransactionAttack {
  tokenSymbol: string;
  rootTransaction: string;
  transactionsPaths: string[][];
}

export enum ChainId {
  Ethereum = 1,
  Arbitrum = 42161,
  Polygon = 137,
  Gnosis = 100,
  Fantom = 250,
  Optimism = 10,
}

// Define the ChainInfo type
export type ChainInfo = {
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
  blockExplorerApiUrl: string;
  apiKey: string;
  attackRootTransactionHashes?: string[]
};
