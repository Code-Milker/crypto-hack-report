import { ethers } from 'ethers';
import {
  RawTransactionAttackWithMetaData,
  TransactionPathFromAttack,
  TransactionPathWithContext,
  TransactionPathWithFailedContext,
} from './types';
import 'dotenv/config'; // Loads .env variables into process.env
import { transactionSchema } from './types';
import { z } from 'zod';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import * as path from 'path';
export const fetchTransaction = async (attack: RawTransactionAttackWithMetaData) => {
  const fileName = getFileName(attack);
  const provider = createProvider(attack.rpcUrl);
  const dirPath = path.dirname(fileName);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true }); // Create directory if it doesn't exist
  }

  // Build the transaction path from the attack
  const transactionPathFromAttack = buildTransactionPath(attack);

  // Fetch the transaction path details
  const attackDetails = await fetchTransactionPathDetails(transactionPathFromAttack, provider);

  // If the file already exists, delete it to clear it
  if (existsSync(fileName)) {
    unlinkSync(fileName);
  }

  // Write the output to the file
  console.log(JSON.stringify(attackDetails, null, 2));
  writeFileSync(fileName, JSON.stringify(attackDetails, null, 2));
};
export const createProvider = (rpcUrl: string): ethers.JsonRpcProvider => {
  return new ethers.JsonRpcProvider(rpcUrl);
};

// ABI to fetch decimals dynamically from the token contract
const erc20Abi = ['function decimals() view returns (uint8)'];

export const fetchTransactionDetails = async (
  transactionHash: string,
  provider: ethers.Provider,
): Promise<
  Omit<TransactionPathWithContext, 'nextTransactions'> | TransactionPathWithFailedContext | null
> => {
  try {
    // Fetch transaction details from ethers.js
    const transaction = await provider.getTransaction(transactionHash);

    // Validate the transaction object using Zod
    const validationResult = transactionSchema.safeParse(transaction);
    if (!validationResult.success) {
      return { error: 'Transaction validation failed' }; // Return an error if Zod validation fails
    }
    const parsedTransaction = validationResult.data;

    // Create an ERC-20 interface to decode logs
    const erc20Interface = new ethers.Interface([
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    ]);

    // Fetch transaction receipt (for logs)
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt) {
      throw new Error(`Transaction receipt not found for ${transactionHash}`);
    }

    // Decode token transfer details from logs
    let tokenDetails: { tokenAddress: string; from: string; to: string; amount: string } | null =
      null;
    for (const log of receipt.logs) {
      const decodedLog = decodeERC20TransferLog(log, erc20Interface);
      if (decodedLog) {
        const tokenAddress = log.address; // Token contract address that emitted the event
        const from = decodedLog.from;
        const to = decodedLog.to;

        // Create a contract instance to fetch the decimals dynamically
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
        let decimals = 18; // Default to 18 decimals

        try {
          decimals = await tokenContract.decimals(); // Fetch decimals dynamically
        } catch (err) {
          console.error(`Failed to fetch decimals for token: ${tokenAddress}`, err);
        }
        const amount = ethers.formatUnits(decodedLog.value, decimals);

        tokenDetails = {
          tokenAddress,
          from,
          to,
          amount,
        };
        break; // Stop after the first token transfer, if relevant
      }
    }

    // Extract ENS name (if available)
    let ensName = '';
    try {
      ensName = (await provider.lookupAddress(parsedTransaction.to)) ?? '';
    } catch {
      ensName = ''; // Set ENS name to empty if lookup fails
    }

    // Fetch the block to get the timestamp
    const block = parsedTransaction.blockNumber
      ? await provider.getBlock(parsedTransaction.blockNumber)
      : null;
    const timeStamp = block ? new Date(block.timestamp * 1000).toISOString() : '';
    if (parsedTransaction.value.toString() !== '0') {
      const ethAmount = ethers.formatEther(parsedTransaction.value);
      tokenDetails = {
        tokenAddress: 'ETH', // This represents the native currency
        from: parsedTransaction.from,
        to: parsedTransaction.to ?? '', // "to" can be null for contract creation
        amount: ethAmount,
      };
    }

    // Return the structured transaction data
    return {
      transactionHash,
      to: tokenDetails?.to ?? '',
      from: tokenDetails?.from ?? '',
      timeStamp,
      blockNumber: parsedTransaction.blockNumber ?? -1,
      ensName,
      tokenAmount: tokenDetails?.amount ?? '',
      tokenContractAddress: tokenDetails?.tokenAddress ?? '',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation Error:', error);
      return { error: 'Validation Error' };
    } else {
      console.error(`Error fetching details for transaction: ${transactionHash}`, error);
      return null;
    }
  }
};

// Fetch transaction details and validate with Zod
const decodeERC20TransferLog = (log: ethers.Log, iface: ethers.Interface) => {
  try {
    // Decode ERC-20 Transfer event logs
    return iface.decodeEventLog('Transfer', log.data, log.topics);
  } catch (error) {
    return null;
  }
};

export const fetchTransactionPathDetails = async (
  transactionPath: TransactionPathFromAttack,
  provider: ethers.Provider,
): Promise<any> => {
  // Fetch details for the current transaction
  const currentTransactionDetails = await fetchTransactionDetails(
    transactionPath.transactionHash,
    provider,
  );

  // Recursively fetch the next transactions
  const nextTransactionDetails = [];
  for (const nextTransaction of transactionPath.nextTransactions) {
    const nextDetail = await fetchTransactionPathDetails(nextTransaction, provider);
    if (nextDetail) {
      nextTransactionDetails.push(nextDetail);
    }
  }

  return {
    ...currentTransactionDetails,
    nextTransactions: nextTransactionDetails,
  };
};

export const getFileName = (payload: RawTransactionAttackWithMetaData): string => {
  return `output/${payload.wallet}/${payload.chainId}/${payload.tokenSymbol}.json`;
};

// Recursive function to convert each transaction path into a nested structure
export const convertToTransactionPath = (hashes: string[]): TransactionPathFromAttack => {
  if (hashes.length === 0) {
    return { transactionHash: '', nextTransactions: [] };
  }

  const [first, ...rest] = hashes;
  return {
    transactionHash: first,
    nextTransactions: rest.length ? [convertToTransactionPath(rest)] : [],
  };
};

// Function to build the entire transaction path with root and multiple branches
export const buildTransactionPath = (attack: {
  rootTransaction: string;
  transactionsPaths: string[][];
}): TransactionPathFromAttack => {
  return {
    transactionHash: attack.rootTransaction,
    nextTransactions: attack.transactionsPaths.map((path) => convertToTransactionPath(path)),
  };
};

export const fetchBlockInfoFromTransaction = async (
  txHash: string,
  provider: ethers.Provider,
): Promise<ethers.Block> => {
  // Step 1: Fetch transaction receipt
  const txReceipt = await provider.getTransactionReceipt(txHash);

  if (!txReceipt) {
    throw Error('Transaction not found');
  }

  // Step 2: Get the block number from the transaction receipt
  const blockNumber = txReceipt.blockNumber;

  // Step 3: Fetch block information using the block number
  const blockInfo = await provider.getBlock(blockNumber);
  if (!blockInfo || !blockInfo?.number) {
    throw Error('block number not found');
  }

  return blockInfo;

  // Log the block information
};
