import { ethers } from 'ethers';
import {
  createProvider,
  fetchBlockInfoFromTransaction,
  fetchTransactionDetails,
  getBlockOneWeekAhead,
} from '../utils';
import { ChainInfo, TransactionContext, TransactionPathFromAttack } from '../types';
import { fetchOutgoingEthTransactionsViaEtherscan } from '../api/etherscan';


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

