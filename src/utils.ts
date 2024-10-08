import { ethers } from 'ethers';
import {
  TokenTransactionContext,
  TransactionContext
} from './types';
import 'dotenv/config'; // Loads .env variables into process.env
import { transactionSchema } from './types';
import { z } from 'zod';
export const createProvider = (rpcUrl: string): ethers.JsonRpcProvider => {
  return new ethers.JsonRpcProvider(rpcUrl);
};



// ERC-20 ABI to fetch decimals
const erc20Abi = ['function decimals() view returns (uint8)'];

// Function to fetch transaction details
export const fetchTransactionDetails = async (
  transactionHash: string,
  provider: ethers.Provider,
): Promise<TokenTransactionContext | TransactionContext> => {
  // Fetch transaction details
  const transaction = await provider.getTransaction(transactionHash);

  // Validate transaction using Zod schema
  const validationResult = transactionSchema.safeParse(transaction);
  if (!validationResult.success) {
    throw new Error('Transaction validation failed');
  }
  const parsedTransaction = validationResult.data;

  // Fetch transaction receipt (for logs)
  const receipt = await provider.getTransactionReceipt(transactionHash);
  if (!receipt) {
    throw new Error(`Transaction receipt not found for ${transactionHash}`);
  }


  // Fetch ENS name, if available
  const ensName = await fetchENSName(parsedTransaction.to, provider);

  // Fetch block timestamp
  const timeStamp = await fetchBlockTimestamp(parsedTransaction.blockNumber, provider);

  // If the transaction involves ETH, format its value
  if (parsedTransaction.value.toString() !== '0') {
    const ethAmount = ethers.formatEther(parsedTransaction.value);
    const res: TransactionContext = {
      transactionHash,
      to: parsedTransaction.to ?? '',
      from: parsedTransaction.from,
      timeStamp,
      blockNumber: parsedTransaction.blockNumber ?? -1,
      ensName,
      amount: ethAmount,
    };
    return res;
  }
  // Decode ERC-20 token transfer from logs
  const tokenDetails = await decodeTokenTransfer(receipt.logs, provider);

  // Return token transfer details if found, otherwise return empty details
  return {
    transactionHash,
    to: tokenDetails?.to ?? '',
    from: tokenDetails?.from ?? '',
    timeStamp,
    blockNumber: parsedTransaction.blockNumber ?? -1,
    ensName,
    amount: tokenDetails?.amount ?? '',
    tokenContractAddress: tokenDetails?.tokenAddress ?? null,
  };
};

// Helper functions

type TokenTransferDetails = {
  tokenAddress: string;
  from: string;
  to: string;
  amount: string;
};
const decodeTokenTransfer = async (logs: readonly ethers.Log[], provider: ethers.Provider): Promise<TokenTransferDetails> => {
  const erc20Interface = new ethers.Interface([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ]);
  console.log(logs)
  for (const log of logs) {
    const decodedLog = decodeERC20TransferLog(log, erc20Interface);
    if (decodedLog) {
      const tokenAddress = log.address;

      // Fetch token decimals
      const decimals = await fetchTokenDecimals(tokenAddress, provider);
      const parsedResponse = z.object({
        tokenAddress: z.string(),
        from: z.string(),
        to: z.string(),
        amount: z.string(),
      }).safeParse({
        tokenAddress,
        from: decodedLog.from,
        to: decodedLog.to,
        amount: ethers.formatUnits(decodedLog.value, decimals),
      });
      if (!parsedResponse.success) {
        throw parsedResponse.error
      }
      return parsedResponse.data;
    }
  }
  throw Error('no logs found')
};

const fetchTokenDecimals = async (tokenAddress: string, provider: ethers.Provider) => {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    return await tokenContract.decimals();
  } catch (err) {
    console.error(`Failed to fetch decimals for token: ${tokenAddress}`, err);
    return 18; // Default to 18 decimals
  }
};

const fetchENSName = async (address: string | null, provider: ethers.Provider) => {
  if (!address) return '';
  try {
    return await provider.lookupAddress(address) ?? '';
  } catch {
    return '';
  }
};

const fetchBlockTimestamp = async (blockNumber: number | null, provider: ethers.Provider) => {
  if (!blockNumber) return '';
  try {
    const block = await provider.getBlock(blockNumber);
    return block ? new Date(block.timestamp * 1000).toISOString() : '';
  } catch (error) {
    console.error(`Failed to fetch block for block number: ${blockNumber}`, error);
    return '';
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

// export const fetchTransactionPathDetails = async (
//   transactionPath: TransactionPathFromAttack,
//   provider: ethers.Provider,
// ): Promise<any> => {
//   // Fetch details for the current transaction
//   const currentTransactionDetails = await fetchTransactionDetails(
//     transactionPath.transactionHash,
//     provider,
//   );
//
//   // Recursively fetch the next transactions
//   const nextTransactionDetails = [];
//   for (const nextTransaction of transactionPath.nextTransactions) {
//     const nextDetail = await fetchTransactionPathDetails(nextTransaction, provider);
//     if (nextDetail) {
//       nextTransactionDetails.push(nextDetail);
//     }
//   }
//
//   return {
//     ...currentTransactionDetails,
//     nextTransactions: nextTransactionDetails,
//   };
// };


// Recursive function to convert each transaction path into a nested structure
// export const convertToTransactionPath = (hashes: string[]): TransactionPathFromAttack => {
//   if (hashes.length === 0) {
//     return { transactionHash: '', nextTransactions: [] };
//   }
//
//   const [first, ...rest] = hashes;
//   return {
//     transactionHash: first,
//     nextTransactions: rest.length ? [convertToTransactionPath(rest)] : [],
//   };
// };

// Function to build the entire transaction path with root and multiple branches
// export const buildTransactionPath = (attack: {
//   rootTransaction: string;
//   transactionsPaths: string[][];
// }): TransactionPathFromAttack => {
//   return {
//     transactionHash: attack.rootTransaction,
//     nextTransactions: attack.transactionsPaths.map((path) => convertToTransactionPath(path)),
//   };
// };

export const fetchBlockInfoFromTransaction = async (
  transactionHash: string,
  provider: ethers.Provider,
): Promise<ethers.Block> => {
  // Step 1: Fetch transaction receipt
  const txReceipt = await provider.getTransactionReceipt(transactionHash);

  if (!txReceipt) {
    throw Error('Transaction not found ' + transactionHash);
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
export function getBlockOneWeekAhead(startBlock: number) {
  const blocksPerDay = 6500; // Approximate blocks per day on Ethereum (13 seconds per block)
  const daysInWeek = 7;
  const blocksInWeek = blocksPerDay * daysInWeek; // About 45,500 blocks in a week

  // Calculate the block number one week ahead
  const endBlock = startBlock + blocksInWeek;
  return endBlock;
}
