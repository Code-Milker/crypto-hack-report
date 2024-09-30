import { ethers } from 'ethers';
import { TransactionPathFromAttack, TransactionPathWithContext, TransactionPathWithFailedContext } from './types';
import 'dotenv/config'; // Loads .env variables into process.env
import { transactionSchema } from './types';
import { z } from 'zod';
const provider = ethers.getDefaultProvider('homestead');
export const fetchTransactionDetails = async (
  transactionHash: string
): Promise<Omit<TransactionPathWithContext, 'nextTransactions'> | TransactionPathWithFailedContext | null> => {
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
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ]);

    // Fetch transaction receipt (for logs)
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt) {
      throw new Error(`Transaction receipt not found for ${transactionHash}`);
    }

    // Decode token transfer details from logs
    let tokenDetails: { tokenAddress: string; from: string; to: string; amount: string } | null = null;
    for (const log of receipt.logs) {
      const decodedLog = decodeERC20TransferLog(log, erc20Interface);
      if (decodedLog) {
        tokenDetails = {
          tokenAddress: log.address, // Token contract address that emitted the event
          from: decodedLog.from,
          to: decodedLog.to,
          amount: ethers.formatUnits(decodedLog.value, 18), // Assuming 18 decimals for token amount
        };
        break; // Stop after the first token transfer, if relevant
      }
    }

    // Extract ENS name (if available)
    let ensName = '';
    try {
      ensName = await provider.lookupAddress(parsedTransaction.to) ?? '';
    } catch {
      ensName = ''; // Set ENS name to empty if lookup fails
    }

    // Fetch the block to get the timestamp
    const block = parsedTransaction.blockNumber ? await provider.getBlock(parsedTransaction.blockNumber) : null;
    const timeStamp = block ? new Date(block.timestamp * 1000).toISOString() : '';

    // Return the structured transaction data
    //
    return {
      transactionHash,
      to: tokenDetails?.to ?? '',
      from: tokenDetails?.from ?? '',
      timeStamp,
      blockNumber: parsedTransaction.blockNumber ?? -1,
      ensName,
      tokenName: tokenDetails ? '' : 'ETH', // Set to 'ETH' if no token details are found
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
    return iface.decodeEventLog("Transfer", log.data, log.topics);
  } catch (error) {
    return null;
  }
};

export const fetchTransactionPathDetails = async (transactionPath: TransactionPathFromAttack): Promise<any> => {
  // Fetch details for the current transaction
  const currentTransactionDetails = await fetchTransactionDetails(transactionPath.transactionHash);

  // Recursively fetch the next transactions
  const nextTransactionDetails = [];
  for (const nextTransaction of transactionPath.nextTransactions) {
    const nextDetail = await fetchTransactionPathDetails(nextTransaction);
    if (nextDetail) {
      nextTransactionDetails.push(nextDetail);
    }
  }

  return {
    ...currentTransactionDetails,
    nextTransactions: nextTransactionDetails,
  };
};
