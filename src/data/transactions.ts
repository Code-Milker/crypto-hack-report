import { ethers } from 'ethers';
import { ChainInfo, TransactionContext, DecodedMethodResult, DecodedParam } from '../types';
import { delay, getBlockDaysAhead } from '../utils';
import { fetchContractAbi, fetchTransactionForAddress, TransactionDetails } from '../api/etherscan';
import {
  decodeLog,
  decodeMethod,
  fetchTransaction,
  getContractBehindProxy,
  DecodedLogResult,
  FailedDecodedLogResult,
  getTokenTransactionsFromAddressAfterBlock,
} from '../api/rpc';
import {
  cacheTransactionInformation,
  getCachedTransactionInformation,
} from '../dbCalls/transaction';
import { isNativeTokenTransferWithinRange } from '../api/coinGecko';
import { sum } from 'lodash';
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
  return await decodeMethod(transactionHash, contractAbi, provider);
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
    const decodedLog = await decodeLog(l, contractAbi);
    if (decodedLog.success) {
      decodedLogs.push(decodedLog);
    } else {
      failedDecodedlogs.push(decodedLog);
    }
  }

  return { decodedLogs, failedDecodedlogs };
};
export type TransactionNativeType =
  | 'nativeTransfer'
  | 'directTransfer'
  | 'sum'
  | 'split'
  | 'end'
  | 'root';
export type TransactionContractType = 'contractCall' | 'end' | 'transfer' | 'method' | 'root';
export interface FetchNativeTransaction {
  transactionType: TransactionNativeType[];
  transactionContext: TransactionContext;
}
export interface FetchContractTransaction {
  transactionType: TransactionContractType[];
  transactionContext: TransactionContext;
  events: DecodedEvents;
  method: DecodedMethodResult;
}

export const fetchTransactionInformation = async (
  params: { transactionHash: string },
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
): Promise<FetchContractTransaction | FetchNativeTransaction> => {
  const cachedTransactionInformation = await getCachedTransactionInformation(
    params.transactionHash,
    chain.chainId,
  );
  if (cachedTransactionInformation !== null) {
    return cachedTransactionInformation;
  }
  const transactionContext: TransactionContext = await fetchTransaction(
    params.transactionHash,
    provider,
  );
  let payload: FetchNativeTransaction | FetchContractTransaction = {
    transactionContext,
    transactionType: ['nativeTransfer'],
  };
  if (transactionContext.to.type === 'contract') {
    const method = await fetchMethodInformationByTransactionHash(
      params.transactionHash,
      provider,
      chain,
    );
    const events = await fetchEventInformationByTransactionHash(
      params.transactionHash,
      provider,
      chain,
    );
    payload = { transactionContext, transactionType: ['contractCall'], method, events };
  }
  cacheTransactionInformation(params.transactionHash, chain.chainId, payload);
  return payload;
};

function sumTransactions(
  transactions: Array<TransactionDetails>,
  targetTransaction: TransactionDetails,
) {
  const incomingTxs = transactions.filter((tx) => tx.to === targetTransaction.from); // Incoming transactions to the address
  const outgoingValue = BigInt(targetTransaction.value);

  // Calculate the allowed variance (2%)
  const lowerBound = outgoingValue - (outgoingValue * BigInt(2)) / BigInt(100);
  const upperBound = outgoingValue + (outgoingValue * BigInt(2)) / BigInt(100);

  // Find a combination of transactions that sum to the outgoing transaction's value within the variance range
  const result = findCombination(incomingTxs, lowerBound, upperBound);

  return result ? result : [];
}

// Helper function to find a combination of transactions that sum to a target within a variance range
function findCombination(
  txs: Array<TransactionDetails>,
  lowerBound: bigint,
  upperBound: bigint,
  combination: Array<TransactionDetails> = [],
): Array<TransactionDetails> | null {
  const currentSum = combination.reduce((acc, tx) => acc + BigInt(tx.value), BigInt(0));

  if (currentSum >= lowerBound && currentSum <= upperBound) {
    return combination; // Success if the current sum is within the variance range
  }

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const newCombination = [...combination, tx];
    const result = findCombination(txs.slice(i + 1), lowerBound, upperBound, newCombination);

    if (result) {
      return result; // Return the first valid combination
    }
  }

  return null; // No combination found
}

function splitTransaction(
  transactions: Array<TransactionDetails>,
  targetTransaction: TransactionDetails,
) {
  const outgoingTxs = transactions.filter((tx) => tx.from === targetTransaction.from); // Outgoing transactions from the address
  const outgoingValue = BigInt(targetTransaction.value);

  // Calculate the allowed variance (2%)
  const lowerBound = outgoingValue - (outgoingValue * BigInt(2)) / BigInt(100);
  const upperBound = outgoingValue + (outgoingValue * BigInt(2)) / BigInt(100);

  // Find a split of transactions that sum to the target outgoing value within the variance range
  const result = findSplitCombination(outgoingTxs, lowerBound, upperBound);

  return result ? result : [];
}

// Helper function to find a split of transactions that sum to a target within a variance range
function findSplitCombination(
  txs: Array<TransactionDetails>,
  lowerBound: bigint,
  upperBound: bigint,
  combination: Array<TransactionDetails> = [],
): Array<TransactionDetails> | null {
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

export const fetchTransactionInteractionInformation = async (
  params: {
    transactionHash: string;
    transactionType: TransactionNativeType | TransactionContractType;
    eventDepth: number;
    nativeDepth: number;
    methodDepth: number;
    path: (FetchContractTransaction | FetchNativeTransaction)[];
  },
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
) => {
  const res = await fetchTransactionInformation(params, provider, chain);
  const endBlock = getBlockDaysAhead(res.transactionContext.blockNumber, 10);
  const transactionsForAddress = await fetchTransactionForAddress(
    res.transactionContext.to.address,
    endBlock,
    chain,
  );
  const nativeTransactions: FetchNativeTransaction[] = [];
  const contractTransactions: FetchContractTransaction[] = [];
  for (const t of transactionsForAddress) {
    // sort transactions by event type
    if (params.transactionHash === t.hash) {
      continue;
    }
    const transactionInformation = await fetchTransactionInformation(
      { transactionHash: t.hash },
      provider,
      chain,
    );
    if (transactionInformation.transactionType[0] === 'nativeTransfer') {
      const nativeTransaction = transactionInformation as FetchNativeTransaction;

      const possibleDirectTransfer = await isNativeTokenTransferWithinRange(
        Number(res.transactionContext.formattedValue),
        Number(transactionInformation.transactionContext.formattedValue),
        200,
        chain,
      );
      if (possibleDirectTransfer) {
        nativeTransactions.push({
          ...nativeTransaction,
          transactionType: [...nativeTransaction.transactionType, 'directTransfer'],
        });
      }
      const split = splitTransaction(transactionsForAddress, t);
      if (split?.length > 0) {
        nativeTransactions.push({
          ...nativeTransaction,
          transactionType: [...nativeTransaction.transactionType, 'split'],
        });
      }
      const sum = sumTransactions(transactionsForAddress, t);
      if (sum.length) {
        nativeTransactions.push({
          ...nativeTransaction,
          transactionType: [...nativeTransaction.transactionType, 'sum'],
        });
      }
    }

    if (transactionInformation.transactionType[0] === 'contractCall') {
      const contractTransaction = transactionInformation as FetchContractTransaction;

      if (contractTransaction.method.methodName === 'Transfer') {
        contractTransactions.push({
          ...contractTransaction,
          transactionType: [...contractTransaction.transactionType, 'transfer'],
        });
      } else {
        contractTransactions.push({
          ...contractTransaction,
          transactionType: [...contractTransaction.transactionType, 'method'],
        });
      }
    }
  }

  return { nativeTransactions, contractTransactions };
};
const fetchTransactionInformationPath = async (
  params: {
    transactionHash: string;
    transactionType: TransactionNativeType | TransactionContractType;
    eventDepth: number;
    nativeDepth: number;
    methodDepth: number;
    path: (FetchContractTransaction | FetchNativeTransaction)[];
  },
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
) => {
  const res = await fetchTransactionInteractionInformation(params, provider, chain);

  for (const t of res.nativeTransactions) {
    // {
    //       transactionHash: t.transactionContext.transactionHash,
    //       transactionType: t.transactionType,
    //       eventDepth: eventDepth - 1,
    //       nativeDepth: nativeDepth - 1,
    //       methodDepth: methodDepth: - 1 }
    fetchTransactionInformationPath(
      {
        path: ['TODO figure out recursive object here'],
        transactionType: 'directTransfer',
        transactionHash: t.transactionContext.transactionHash,
        eventDepth: params.eventDepth - 1,
        nativeDepth: params.nativeDepth - 1,
        methodDepth: params.methodDepth - 1,
      },
      provider,
      chain,
    );
  }
};

// Usage

// const rootTransactionDetails: TransactionContext = await fetchTransactionDetails(params.transactionHash, provider);
// if (rootTransactionDetails.to.type === 'EOA') { // we know its a  transfer
//
// }
// if (rootTransactionDetails.to.type === 'contract') { //
//
