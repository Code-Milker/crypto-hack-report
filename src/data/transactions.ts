import { ethers } from 'ethers';
import { ChainInfo, TransactionContext, DecodedMethodResult } from '../types';
import { delay, isTokenTransferWithinRange } from '../utils';
import { fetchContractAbi, fetchTransactionForAddress, TransactionDetails } from '../api/etherscan';
import {
  decodeLog,
  decodeMethod,
  fetchTransaction,
  getContractBehindProxy,
  DecodedLogResult,
  FailedDecodedLogResult,
  getBlockDaysAhead,
} from '../api/rpc';
import {
  cacheTransactionInformation,
  getCachedTransactionInformation,
} from '../dbCalls/transaction';
import { fetchTokenCoinGeckoData, } from '../api/coinGecko';
import { KnownWallets } from '../info';
import { values } from 'lodash';
export const fetchMethodInformationByTransactionHash = async (
  transactionHash: string,
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
) => {
  const rootTransactionDetails: TransactionContext = await fetchTransaction(
    transactionHash,
    provider,
  );
  const rootAddress = await getContractBehindProxy(rootTransactionDetails.to.address, provider);
  const contractAbi = rootAddress
    ? await fetchContractAbi(rootAddress, chain)
    : await fetchContractAbi(rootTransactionDetails.to.address, chain);
  if (contractAbi === '{}') {
    return null;
  }
  try {
    const res = await decodeMethod(transactionHash, contractAbi, provider)
    return res
  } catch {

    return null;
  }
};
export interface DecodedEvents {
  decodedLogs: DecodedLogResult[];
  failedDecodedlogs: FailedDecodedLogResult[];
}
export const fetchEventInformationByTransactionHash = async (
  transactionHash: string,
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
): Promise<DecodedEvents> => {
  const rootTransactionDetails: TransactionContext = await fetchTransaction(
    transactionHash,
    provider,
  );
  const decodedLogs = [];
  const failedDecodedlogs = [];
  for (const l of rootTransactionDetails.receipt.logs) {
    await delay(401);
    const rootAddress = await getContractBehindProxy(l.address, provider);
    const contractAbi = rootAddress
      ? await fetchContractAbi(rootAddress, chain)
      : await fetchContractAbi(l.address, chain);
    if (contractAbi === '{}') {
      const err: FailedDecodedLogResult = { 'address': l.address, success: false }
      failedDecodedlogs.push(err)
      continue
    }
    const decodedLog = await decodeLog(l, contractAbi);
    if (decodedLog.success) {
      decodedLogs.push(decodedLog);
    } else {
      failedDecodedlogs.push(decodedLog);
    }
  }

  return { decodedLogs, failedDecodedlogs };
};
// export type TransactionNativeType =
//   | 'nativeTransfer'
//   | 'directTransfer'
//   | 'sum'
//   | 'split'
//   | 'end'
//   | 'root'
//   | 'unknown';
// export type TransactionContractType =
//   | 'contractCall'
//   | 'end'
//   | 'transfer'
//   | 'method'
//   | 'root'
//   | 'unknown';
export interface FetchTransactionInformation {
  context: TransactionContext;
  decodedEvents: DecodedEvents | null;
  decodedMethod: DecodedMethodResult | null;
}

export const fetchTransactionInformation = async (
  transactionHash: string,
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
): Promise<FetchTransactionInformation> => {
  const cachedTransactionInformation = await getCachedTransactionInformation(
    transactionHash,
    chain.chainId,
  );
  if (cachedTransactionInformation !== null) {
    return cachedTransactionInformation;
  }
  await delay(100)
  const context: TransactionContext = await fetchTransaction(transactionHash, provider);
  let payload: FetchTransactionInformation = { context, decodedMethod: null, decodedEvents: null }
  if (context.to.type === 'contract') {
    const decodedMethod = await fetchMethodInformationByTransactionHash(transactionHash, provider, chain);
    const decodedEvents = await fetchEventInformationByTransactionHash(transactionHash, provider, chain);
    cacheTransactionInformation(transactionHash, chain.chainId, payload);
    payload = { context, decodedMethod, decodedEvents };
  }
  cacheTransactionInformation(transactionHash, chain.chainId, payload);
  return payload;
};

// function sumTransactions(
//   transactions: FetchNativeTransaction[],
//   targetTransaction: FetchNativeTransaction,
// ) {
//   console.log(transactions[0].transactionContext.from, transactions[0].transactionContext.to)
//   const outgoingValue = BigInt(targetTransaction.transactionContext.value);
//   console.log({ outgoingValue })
//
//   // Calculate the allowed variance (2%)
//   const lowerBound = outgoingValue - (outgoingValue * BigInt(2)) / BigInt(100);
//   const upperBound = outgoingValue + (outgoingValue * BigInt(2)) / BigInt(100);
//
//   // Find a combination of transactions that sum to the outgoing transaction's value within the variance range
//   const result = findCombination(transactions, lowerBound, upperBound);
//
//   return result ? result : [];
// }

// Helper function to find a combination of transactions that sum to a target within a variance range
// function findCombination(
//   txs: FetchNativeTransaction[],
//   lowerBound: bigint,
//   upperBound: bigint,
//   combination: FetchNativeTransaction[] = [],
// ): FetchNativeTransaction[] | null {
//   const currentSum = combination.reduce((acc, tx) => acc + BigInt(tx.transactionContext.value), BigInt(0));
//
//   if (currentSum >= lowerBound && currentSum <= upperBound) {
//     return combination; // Success if the current sum is within the variance range
//   }
//
//   for (let i = 0; i < txs.length; i++) {
//     const tx = txs[i];
//     const newCombination = [...combination, tx];
//     const result = findCombination(txs.slice(i + 1), lowerBound, upperBound, newCombination);
//
//     if (result) {
//       return result; // Return the first valid combination
//     }
//   }
//
//   return null; // No combination found
// }
//
// function splitTransaction(
//   transactions: { from: string, value: string }[],
//   totalAmount: string,
//   fromAddress: string,
//   variance: number,
// ) {
//   let outgoingTxs: { from: string, value: string }[] = [];
//   let index = 0;
//
//   // Filter outgoing transactions manually using a while loop
//   while (index < transactions.length) {
//     if (transactions[index].from === fromAddress && transactions[index].value !== '0') {
//
//       outgoingTxs.push(transactions[index]);
//     }
//     index++;
//   }
//
//   const outgoingValue = BigInt(totalAmount);
//
//   // Calculate the allowed variance (2%)
//   const lowerBound = outgoingValue - (outgoingValue * BigInt(variance)) / BigInt(100);
//   const upperBound = outgoingValue + (outgoingValue * BigInt(variance)) / BigInt(100);
//
//   // Find a split of transactions that sum to the target outgoing value within the variance range
//   const result = findSplitCombination(outgoingTxs, lowerBound, upperBound);
//   return result ? result : [];
// }

// Helper function to find a split of transactions that sum to a target within a variance range
function findSplitCombination(
  txs: Array<{ from: string, value: string }>,
  lowerBound: bigint,
  upperBound: bigint,
  combination: Array<{ from: string, value: string }> = [],
): Array<{ from: string, value: string }> | null {
  const currentSum = combination.reduce((acc, tx) => acc + BigInt(tx.value), BigInt(0));
  // Check if current sum is within the range
  if (currentSum >= lowerBound && currentSum <= upperBound) {
    return combination; // Success if the current sum is within the variance range
  }

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const newCombination = [...combination, tx];
    const result = findSplitCombination(txs.slice(i + 1), lowerBound, upperBound, newCombination);

    if (result) {
      return result; // Return the first valid split combination
    }
  }

  return null; // No valid split combination found
}
// export const fetchTransactionInteractionInformation = async (
//   transactionHash: string,
//   provider: ethers.JsonRpcProvider,
//   chain: ChainInfo,
// ) => {
//   const transactionInformation = await fetchTransactionInformation(
//     transactionHash,
//     provider,
//     chain,
//   );
//
//   const endBlock = getBlockDaysAhead(transactionInformation.context.blockNumber, 10);
//
//   const transactionsForAddress = await fetchTransactionForAddress(
//     transactionInformation.context.to.address,
//     transactionInformation.context.blockNumber,
//     endBlock,
//     chain
//   );
//   const nativeTransactions: FetchNativeTransaction[] = [];
//   const contractTransactions: FetchContractTransaction[] = [];
//   for (const t of transactionsForAddress) {
//     if (t.hash === transactionHash) {
//       continue
//     }
//     // sort transactions by event type
//     const transactionInformationToAddress = await fetchTransactionInformation(
//       t.hash,
//       provider,
//       chain,
//     );
//     if (transactionInformationToAddress.transactionType === 'nativeTransfer') {
//       const usdData = await fetchTokenCoinGeckoData(chain.nativeCurrency.name, chain)
//       const inRange = await isTokenTransferWithinRange(Number(transactionInformation.transactionContext.value), Number(t.value), 5, usdData)
//       const nativeTransaction = transactionInformationToAddress as FetchNativeTransaction;
//       if (inRange) {
//         nativeTransactions.push({ ...transactionInformationToAddress, transactionType: 'directTransfer' });
//         continue
//       }
//       nativeTransactions.push(nativeTransaction);
//     } else if (transactionInformationToAddress.transactionType[0] === 'contractCall') {
//       const contractTransaction = transactionInformationToAddress as FetchContractTransaction;
//       if (contractTransaction.method?.methodName === 'Transfer') {
//         contractTransactions.push({
//           ...contractTransaction,
//           transactionType: 'transfer',
//         });
//       } else {
//         contractTransactions.push({
//           ...contractTransaction,
//           transactionType: 'method',
//         });
//       }
//     }
//
//   }
//   return {
//     transactionInformation,
//     nativeTransactions,
//     contractTransactions,
//   };
// };

// interface TransactionInformationNode {
//   transactionInformation: FetchContractTransaction | FetchNativeTransaction;
//   nativeTransactions: FetchNativeTransaction[];
//   contractTransactions: FetchContractTransaction[];
//   next?: TransactionInformationNode
//   exitReason?: 'unknown' | 'depth-limit-reached' | 'CEX-Specific'
//
// }


// export function flattenTransactions(node: TransactionInformationNode): TransactionInformationNode[] {
//   const { next, ...onlyNode } = node
//   let transactions: TransactionInformationNode[] = [onlyNode];
//
//   // Recursively flatten the next node if it exists
//   if (node.next) {
//     transactions = transactions.concat(flattenTransactions(node.next));
//   }
//
//   return transactions;
// }
// lets get this path spitting out correctly for native 
export const fetchTransactionInformationPath = async (
  startingTransactionHash: string,
  depth: number,
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
): Promise<any | null> => {
  const transactionInformation = await fetchTransactionInformation(startingTransactionHash, provider, chain); // determine correct Path to choose here
  // transactionInformation
  const startBlock = transactionInformation.context.blockNumber;
  const endBlock = await getBlockDaysAhead(startBlock, 15, provider);

  console.log(transactionInformation.context.transactionHash, startBlock, endBlock, chain)
  const transactions = await fetchTransactionForAddress(transactionInformation.context.from.address, startBlock, endBlock, chain)
  transactions.forEach(t => {
    console.log(t.hash, t.blockNumber, t.value)
  })
  // console.log(transactions)
  // if (depth === 0) {
  //   return { ...transactionInformation, exitReason: 'depth-limit-reached' };
  // }
  //
  // const addressInformation = transactionInformation.transactionInformation.transactionContext.to.info
  // if (addressInformation && addressInformation.type === 'CEX-Specific') {
  //   console.log(transactionHash, 'is cex')
  //   return { ...transactionInformation, exitReason: 'CEX-Specific' }
  // }
  //
  // const transactionType = transactionInformation.transactionInformation.transactionType;
  // if (transactionType === 'nativeTransfer') {
  //   // console.log({ native: transactionInformation.nativeTransactions })
  //   // we had a native transfer, lets see what matches we found
  //   for (const t of transactionInformation.nativeTransactions) {
  //
  //     console.log({ nativeTransactions: transactionInformation.nativeTransactions })
  //     const nativeTransactionType = t.transactionType[
  //       t.transactionType.length - 1
  //     ] as TransactionNativeType;
  //
  //     if (nativeTransactionType === 'directTransfer') {
  //       const next = await fetchTransactionInformationPath(
  //         t.transactionContext.transactionHash,
  //         depth - 1,
  //         provider,
  //         chain,
  //       );
  //       return next ? { ...transactionInformation, next } : transactionInformation;
  //     }
  //     console.log({ nativeTransactions: transactionInformation.nativeTransactions[0].transactionContext })
  //   }
  // }
  // else if (transactionType === 'contractCall') {
  //   // we had a native transfer, lets see what matches we found
  //   for (const t of res.contractTransactions) {
  //     const contractTransactionType = t.transactionType[
  //       t.transactionType.length - 1
  //     ] as TransactionContractType;
  //     if (contractTransactionType === 'unknown') {
  //       return res;
  //     } else if (contractTransactionType === 'transfer') {
  //       return res; // todo
  //     } else if (contractTransactionType === 'method') {
  //       return res; // todo
  //     }
  //   }
  // }

  return null;
};

