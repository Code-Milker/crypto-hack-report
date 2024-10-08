import { ethers } from 'ethers';
import {
  createProvider,
  fetchBlockInfoFromTransaction,
  fetchTransactionDetails,
  getBlockOneWeekAhead,
} from '../utils';
import { ChainInfo, TransactionContext, TransactionPathFromAttack } from '../types';

// Fetch outgoing ETH transactions via Etherscan
const fetchOutgoingEthTransactionsViaEtherscan = async (
  provider: ethers.Provider,
  account: string,
  fromTransactionHash: string, // Transaction hash to start from
  chainInfo: ChainInfo,
): Promise<TransactionContext[]> => {
  // Get the block for the provided transaction hash
  //
  const startBlock = await fetchBlockInfoFromTransaction(fromTransactionHash, provider);
  const endBlock = getBlockOneWeekAhead(startBlock.number);
  const url = `${chainInfo.blockExplorerApiUrl}?module=account&action=txlist&address=${account}&startblock=${startBlock.number}&endblock=${endBlock}&sort=asc&apikey=${chainInfo.apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  // Filter for outgoing ETH transactions
  const outgoingTransactions = data.result.filter(
    (tx: any) => tx.from.toLowerCase() === account.toLowerCase() && tx.value > 0,
  );

  // Map to TransactionPathWithContext format
  const transactionDetails: TransactionContext[] = outgoingTransactions.map((tx: any) => {
    const ethAmount = ethers.formatEther(tx.value);
    const transaction: TransactionContext = {
      transactionHash: tx.hash,
      from: tx.from,
      to: tx.to,
      amount: ethAmount,
      timeStamp: new Date(tx.timeStamp * 1000).toISOString(),
      blockNumber: tx.blockNumber,
      ensName: '', // Optionally add ENS lookup logic here
    }
    return transaction;
  });

  return transactionDetails;
};

// Example integration with recursive function
export const recursiveFetchEthTransactions = async (
  provider: ethers.Provider,
  startAddress: string,
  depth: number,
  fromTransactionHash: string,
  transactionLimit: number,
  chainInfo: ChainInfo,
): Promise<TransactionPathFromAttack[]> => {
  console.log('at depth: ', depth);
  console.log('fetching for transaction: ', fromTransactionHash);
  if (depth === 0) return [];
  // Fetch outgoing ETH transactions via Etherscan
  const ethTransactions: TransactionContext[] = await fetchOutgoingEthTransactionsViaEtherscan(
    provider,
    startAddress,
    fromTransactionHash,
    chainInfo,
  );

  // Limit the number of transactions returned
  const limitedTransactions = ethTransactions.slice(0, transactionLimit);
  const res: TransactionPathFromAttack[] = []
  for (const transaction of limitedTransactions) {
    const nextTransactions = await recursiveFetchEthTransactions(
      provider,
      transaction.to,
      depth - 1,
      transaction.transactionHash,
      transactionLimit,
      chainInfo,
    );
    res.push({ ...transaction, nextTransactions: nextTransactions })
  }
  return res;
};

