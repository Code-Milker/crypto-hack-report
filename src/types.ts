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

export interface TransactionPathFromAttack {
  transactionHash: string;
  nextTransactions: TransactionPathFromAttack[];
}

export interface TransactionContext {
  to: string;
  from: string;
  timeStamp: string;
  blockNumber: number;
  ensName?: string; // Optional if ENS is not available
  tokenAmount: string;
  tokenContractAddress: string;
}
export interface TransactionPathWithFailedContext {
  error: string;
}
export interface TransactionPathWithContext extends TransactionContext, TransactionPathFromAttack {}
export interface RawTransactionAttack {
  wallet: string;
  tokenSymbol: string;
  rootTransaction: string;
  transactionsPaths: string[][];
}
