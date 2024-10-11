import { ethers } from 'ethers';
import {
  fetchBlockInfoFromTransaction,
  fetchTransactionDetails,
  getBlockOneWeekAhead,
} from '../utils';
import { ChainInfo, TokenTransactionContext, TransactionContext, TransactionPathFromAttack, } from '../types';
import {
  cacheEvents,
  fetchStepData,
  getCachedEvents,
  getStepStatus,
  writeStepDataWithTransactionHashIndex,
} from '../dbCalls/db';
import { AttackedInformation } from './0_attackInformation';
import { recursiveFetchEthTransactions } from './test';
// Define the ERC20 ABI with the decimals function
const erc20ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

export async function fetchOrCacheEvents(
  tokenContract: ethers.Contract,
  tokenContractAddress: string,
  account: string,
  block: ethers.Block,
): Promise<(ethers.EventLog | ethers.Log)[]> {
  const startBlock = block.number;
  const endBlock = getBlockOneWeekAhead(startBlock);

  // Check if events are cached
  const cachedEvents = await getCachedEvents(tokenContractAddress, startBlock, endBlock);
  if (cachedEvents) {

    return cachedEvents;
  } else {
    console.log('No cache entry found. Fetching from the blockchain...');

    // Create a filter for outgoing transfers
    const transferFilterOutgoing = tokenContract.filters.Transfer(account, null);

    // Fetch events from the blockchain
    const eventsOutgoing = await tokenContract.queryFilter(
      transferFilterOutgoing,
      startBlock,
      endBlock,
    );

    // Cache the fetched events
    await cacheEvents(tokenContractAddress, startBlock, endBlock, eventsOutgoing);

    console.log('Fetched from blockchain and cached.');
    return eventsOutgoing;
  }
}

// Fetch only outgoing token transactions for a specific account
const fetchOutgoingTokenTransactions = async (
  provider: ethers.JsonRpcProvider,
  tokenContractAddress: string,
  account: string,
  fromTransactionHash: string, // Optional starting transaction hash to filter from
  transactionLimit: number,
) => {
  const block = await fetchBlockInfoFromTransaction(fromTransactionHash, provider);
  const tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider);
  // const decimals = await tokenContract.decimals();
  // const transferFilterOutgoing = tokenContract.filters.Transfer(account, null); // Only outgoing transfers
  //
  // // Fetch all outgoing events for the account
  const eventsOutgoing = await fetchOrCacheEvents(
    tokenContract,
    tokenContractAddress,
    account,
    block,
  );

  const limitedEvents = eventsOutgoing
    .sort((a, b) => a.blockNumber - b.blockNumber)
    .slice(0, transactionLimit);
  const transactionDetails: TokenTransactionContext[] | TransactionContext[] = await Promise.all(
    limitedEvents.map(async (event) => {
      const transactionWithContext: TokenTransactionContext | TransactionContext = await fetchTransactionDetails(
        event.transactionHash,
        provider,
      ).then();
      return { ...transactionWithContext, };
    }),
  );
  return transactionDetails;
};

// Recursive function to fetch outgoing token transactions for 'to' addresses
const recursiveFetchTransactions = async (
  provider: ethers.JsonRpcProvider,
  tokenContractAddress: string,
  startAddress: string,
  depth: number,
  fromTransactionHash: string,
  transactionLimit: number,
): Promise<TransactionPathFromAttack[]> => {
  console.log('at depth: ', depth);
  console.log('fetching for transaction: ', fromTransactionHash);
  if (depth === 0) return [];

  // Fetch outgoing transactions for the startAddress
  const transactions = await fetchOutgoingTokenTransactions(
    provider,
    tokenContractAddress,
    startAddress,
    fromTransactionHash,
    transactionLimit,
  );
  // For each transaction, recursively fetch children transactions
  const res: TransactionPathFromAttack[] = []
  for (const transaction of transactions) {
    // Recursively fetch outgoing transactions from the `to` address and store them in the `children` property
    const nextTransactions = await recursiveFetchTransactions(
      provider,
      tokenContractAddress,
      transaction.to,
      depth - 1,
      transaction.transactionHash,
      transactionLimit, // Pass the current transaction's hash as the starting point for the next recursion
    );
    res.push({ ...transaction, nextTransactions: nextTransactions })
  }
  return res;
};

// Initialize the provider using ethers.providers
// const provider = new ethers.JsonRpcProvider(
//   'https://mainnet.infura.io/v3/5e6e5a11eb5f492792fb05057a80a602',
// );

// Start the recursion process
export const generateAttackReport = async (
  rootTransaction: string,
  provider: ethers.JsonRpcProvider,
  chainInfo: ChainInfo,
) => {
  const depth = 5; // Recursion depth
  const limit = 5; // Recursion depth
  const rootTransactionDetails: TokenTransactionContext | TransactionContext = await fetchTransactionDetails(rootTransaction, provider);
  // fetchTransactionLogs
  let nextTransactions;
  if ('tokenContractAddress' in rootTransactionDetails) {
    console.log('erc-20 token fetch: ')
    nextTransactions = await recursiveFetchTransactions(
      provider,
      rootTransactionDetails.tokenContractAddress,
      rootTransactionDetails.to,
      depth,
      rootTransaction,
      limit,
    );
  } else {
    console.log('native token fetch: ')
    nextTransactions = await recursiveFetchEthTransactions(
      provider,
      rootTransactionDetails.to,
      depth,
      rootTransaction,
      limit,
      chainInfo,
    );
  }
  const step1Data = { ...rootTransactionDetails, nextTransactions };
  return step1Data;
};

export const step1 = async () => {
  const { lastWrittenTransaction } = await getStepStatus(1);
  let pastStartingTransactionHash = lastWrittenTransaction === '';
  const data: AttackedInformation[] = await fetchStepData(0);
  for (let walletIndex = 0; walletIndex < data.length; walletIndex++) {
    const wallet = data[walletIndex];
    for (let chainIndex = 0; chainIndex < wallet.chains.length; chainIndex++) {
      const chain = wallet.chains[chainIndex];
      for (
        let transactionIndex = 0;
        transactionIndex < chain.attackRootTransactionHashes.length;
        transactionIndex++
      ) {
        const transactionHash = chain.attackRootTransactionHashes[transactionIndex];

        if (lastWrittenTransaction === transactionHash) {
          pastStartingTransactionHash = true;
        }
        if (pastStartingTransactionHash) {
          const report = await generateAttackReport(
            transactionHash,
            new ethers.JsonRpcProvider(chain.chainInfo.rpcUrl),
            chain.chainInfo,
          );
          writeStepDataWithTransactionHashIndex(1, report, transactionHash);
        }
      }
    }
  }
};
