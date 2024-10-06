import { ethers } from 'ethers';
import {
  createProvider,
  fetchBlockInfoFromTransaction,
  fetchTransactionDetails,
  getBlockOneWeekAhead,
} from '../utils';
import { ChainInfo, TransactionPathWithContext } from '../types';

// Fetch outgoing ETH transactions via Etherscan
const fetchOutgoingEthTransactionsViaEtherscan = async (
  provider: ethers.Provider,
  account: string,
  fromTransactionHash: string, // Transaction hash to start from
  chainInfo: ChainInfo,
): Promise<TransactionPathWithContext[]> => {
  // Get the block for the provided transaction hash
  //
  const startBlock = await fetchBlockInfoFromTransaction(fromTransactionHash, provider);
  const endBlock = getBlockOneWeekAhead(startBlock.number);
  console.log(chainInfo);
  const url = `${chainInfo.blockExplorerApiUrl}?module=account&action=txlist&address=${account}&startblock=${startBlock.number}&endblock=${endBlock}&sort=asc&apikey=${chainInfo.apiKey}`;
  console.log(url);
  const response = await fetch(url);
  const data = await response.json();
  console.log(data);
  // Filter for outgoing ETH transactions
  const outgoingTransactions = data.result.filter(
    (tx: any) => tx.from.toLowerCase() === account.toLowerCase() && tx.value > 0,
  );

  // Map to TransactionPathWithContext format
  const transactionDetails: TransactionPathWithContext[] = outgoingTransactions.map((tx: any) => {
    const ethAmount = ethers.formatEther(tx.value);

    return {
      transactionHash: tx.hash,
      from: tx.from,
      to: tx.to,
      tokenContractAddress: 'ETH', // ETH instead of token address
      tokenAmount: ethAmount,
      timeStamp: new Date(tx.timeStamp * 1000).toISOString(),
      blockNumber: tx.blockNumber,
      ensName: '', // Optionally add ENS lookup logic here
      nextTransactions: [], // Placeholder for recursive transactions
    };
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
): Promise<TransactionPathWithContext[]> => {
  if (depth === 0) return [];
  // Fetch outgoing ETH transactions via Etherscan
  const ethTransactions = await fetchOutgoingEthTransactionsViaEtherscan(
    provider,
    startAddress,
    fromTransactionHash,
    chainInfo,
  );

  // Limit the number of transactions returned
  const limitedTransactions = ethTransactions.slice(0, transactionLimit);

  for (const transaction of limitedTransactions) {
    // Recursively fetch outgoing ETH transactions from the `to` address
    const nextTransactions = await recursiveFetchEthTransactions(
      provider,
      transaction.to,
      depth - 1,
      transaction.transactionHash,
      transactionLimit,
      chainInfo,
    );
    transaction.nextTransactions = nextTransactions;
  }

  return limitedTransactions;
};

// generateAttackReport('0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f', provider)
// generateAttackReport('0xab98d7cca89bbf1b5aa3008ac7c831d63db19e40a53442ebe489a44eeae69739', provider)
