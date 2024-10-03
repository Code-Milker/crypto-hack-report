
import { ethers } from 'ethers';
import { createProvider, fetchBlockInfoFromTransaction, fetchTransactionDetails, getBlockOneWeekAhead } from '../utils';
import { TransactionPathWithContext } from '../types';
import 'dotenv/config'; // Loads .env variables into process.env

const { ETHERSCAN_API_KEY } = process.env;
// Fetch outgoing ETH transactions via Etherscan
const fetchOutgoingEthTransactionsViaEtherscan = async (
  account: string,
  apiKey: string,
): Promise<TransactionPathWithContext[]> => {
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${account}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  // Filter for outgoing ETH transactions
  const outgoingTransactions = data.result.filter(
    (tx: any) => tx.from.toLowerCase() === account.toLowerCase() && tx.value > 0
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
const recursiveFetchEthTransactions = async (
  apiKey: string,
  startAddress: string,
  depth: number,
  transactionLimit: number,
): Promise<TransactionPathWithContext[]> => {
  if (depth === 0) return [];

  // Fetch outgoing ETH transactions via Etherscan
  const ethTransactions = await fetchOutgoingEthTransactionsViaEtherscan(
    startAddress,
    apiKey,
  );

  // Limit the number of transactions returned
  const limitedTransactions = ethTransactions.slice(0, transactionLimit);

  for (const transaction of limitedTransactions) {
    // Recursively fetch outgoing ETH transactions from the `to` address
    const nextTransactions = await recursiveFetchEthTransactions(
      apiKey,
      transaction.to,
      depth - 1,
      transactionLimit,
    );
    transaction.nextTransactions = nextTransactions;
  }

  return limitedTransactions;
};

// Initialize the provider using ethers.providers (if needed for other uses)

const generateAttackReport = async (rootTransaction: string,) => {
  const depth = 3; // Recursion depth
  const rootTransactionDetails = (await fetchTransactionDetails(
    rootTransaction,
    provider,
  )) as TransactionPathWithContext;
  console.log(rootTransactionDetails)
  console.log(ETHERSCAN_API_KEY)
  const nextTransactions = await recursiveFetchEthTransactions(
    ETHERSCAN_API_KEY as string,
    rootTransactionDetails.to,
    depth,
    20,
  );
  console.log(JSON.stringify({ ...rootTransactionDetails, nextTransactions }, null, 2))
};
const provider = createProvider('https://mainnet.infura.io/v3/5e6e5a11eb5f492792fb05057a80a602')
generateAttackReport('0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f')
