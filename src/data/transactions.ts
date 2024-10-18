import { ethers } from 'ethers';
import { ChainInfo, TokenInfo, TransactionContext } from '../types';
import { delay, stringifyBigInt } from '../utils';
import {
  fetchContractAbi,
  fetchTransactionForAddress as fetchTransactionsForAddress,
} from '../api/etherscan';
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
import { KnownWallets } from '../info';
import { values } from 'lodash';
import { fetchTokenCoinGeckoData, getTokenId } from '../api/coinGecko';
export interface DecodedLogs {
  decodedLogs: DecodedLogResult[];
  failedDecodedlogs: FailedDecodedLogResult[];
}
export const decodeLogs = async (
  transactionHash: string,
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
): Promise<DecodedLogs> => {
  const transaction = await provider.getTransactionReceipt(transactionHash);
  if (!transaction) {
    return { decodedLogs: [], failedDecodedlogs: [] };
  }
  const decodedLogs = [];
  const failedDecodedlogs = [];
  for (const l of transaction.logs) {
    const rootAddress = await getContractBehindProxy(l.address, provider);
    const contractAbi = rootAddress
      ? await fetchContractAbi(rootAddress, chain)
      : await fetchContractAbi(l.address, chain);
    if (contractAbi === '{}') {
      const err: FailedDecodedLogResult = { address: l.address, success: false };
      failedDecodedlogs.push(err);
      continue;
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
// export interface FetchTransactionInformation {
//   context: TransactionContext;
//   decodedEvents: DecodedLogs | null;
//   decodedMethod: DecodedMethodResult | null;
// }

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
  txs: Array<{ from: string; value: string }>,
  lowerBound: bigint,
  upperBound: bigint,
  combination: Array<{ from: string; value: string }> = [],
): Array<{ from: string; value: string }> | null {
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

const addressToApiName = {
  '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE': 'spooky-token', // Example: SpookyToken (BOO)
  '0x3Fd3A0c85B70754eFc07aC9Ac0cbBDCe664865A6': 'equalizer',    // Example: Equalizer (EQUAL)
  '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83': 'wrapped-fantom', // Example: Wrapped Fantom (WFTM)
  '0x1B6382DBDEa11d97f24495C9A90b7c88469134a4': 'axelar-usdc',  // Example: Axelar Wrapped USDC (axlUSDC)
  '0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf': 'usd-coin'     // Example: USD Coin (USDC)
};

export const fetchAddressContext = async (
  startBlock: number,
  endBlock: number,
  address: string,
  type: 'root',
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
): Promise<any | null> => {
  const transactions = await fetchTransactionsForAddress(address, startBlock, endBlock, chain);
  const tokenTransferContext: { [key: string]: any[] } = {};
  const nativeTransferContext: any[] = [];
  const contractTransferContext: { [key: string]: any[] } = {};
  // console.log(transactions)
  for (const t of transactions) {
    const info = await fetchTransaction(t.hash, provider, chain);
    if (info.to.type === 'EOA') {
      nativeTransferContext.push({
        transactionHash: t.hash,
        from: t.from,
        to: t.to,
        value: t.value,
        formattedAmount: ethers.formatEther(t.value,),
      })
    }
    if (info.to.type === 'contract' && info.decodedMethod?.methodName === 'transfer') {
      for (const d of info.decodedLogs?.decodedLogs ?? []) {
        const from = d.topics[0];
        const to = d.topics[1];
        const value = d.data[0];
        if (from?.name !== 'from' || (to?.name !== 'to' || value.name !== 'value')) {
          continue; // not a standard erc-20
        }

        // info.to.tokenInfo?.decimals
        if (!tokenTransferContext[info.to.address]) {
          tokenTransferContext[info.to.address] = []
        }
        await delay(334)
        const tokenApiId = await getTokenId(info.to.tokenInfo?.symbol as string)
        if (!tokenApiId) {
          return null
        }
        const tokenPrice = await fetchTokenCoinGeckoData(tokenApiId.id, chain)
        tokenTransferContext[info.to.address].push({
          tokenPriceUSD: tokenPrice,
          transactionHash: d.transactionHash,
          tokenName: info.to.tokenInfo?.name,
          tokensymbol: info.to.tokenInfo?.symbol,
          tokenAddress: info.to.address,
          from: from.value,
          to: to.value,
          value: value.value,
          formattedAmount: ethers.formatUnits(value.value, Number(info.to.tokenInfo?.decimals)),
        });

      }
    } else if (info.to.type === 'contract') {

    }
  };
  // console.log(nativeTransferContext, tokenTransferContext, contractTransferContext)
  console.log(nativeTransferContext, tokenTransferContext)
  Object.keys(tokenTransferContext).forEach(element => {
    console.log(tokenTransferContext[element])

  });
  return null;
}
