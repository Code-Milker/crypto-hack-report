import { ethers } from 'ethers';
import { fetchBlockInfoFromTransaction, fetchTransactionDetails } from '../utils';
import { TransactionPathWithContext } from '../types';
// Define the ERC20 ABI with the decimals function
const erc20ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

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
  const decimals = await tokenContract.decimals();
  const transferFilterOutgoing = tokenContract.filters.Transfer(account, null); // Only outgoing transfers

  // Fetch all outgoing events for the account
  const eventsOutgoing = await tokenContract.queryFilter(transferFilterOutgoing, block.number);

  const limitedEvents = eventsOutgoing
    .sort((a, b) => a.blockNumber - b.blockNumber)
    .slice(0, transactionLimit);
  const transactionDetails: TransactionPathWithContext[] = await Promise.all(
    limitedEvents.map(async (event) => {
      const transactionWithContext: TransactionPathWithContext = await fetchTransactionDetails(
        event.transactionHash,
        provider,
      ).then();
      return { ...transactionWithContext, nextTransactions: [] };
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
) => {
  console.log('at depth: ', depth);
  console.log('fetching for transaction', fromTransactionHash);
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

    // Assign the child transactions to the `children` attribute
    transaction.nextTransactions = nextTransactions;
  }
  return transactions;
};

// Initialize the provider using ethers.providers
const provider = new ethers.JsonRpcProvider(
  'https://mainnet.infura.io/v3/5e6e5a11eb5f492792fb05057a80a602',
);

// Start the recursion process
const generateAttackReport = async (fileName: string, rootTransaction: string) => {
  const depth = 3; // Recursion depth
  const rootTransactionDetails = (await fetchTransactionDetails(
    rootTransaction,
    provider,
  )) as TransactionPathWithContext;
  const nextTransactions = await recursiveFetchTransactions(
    provider,
    rootTransactionDetails.tokenContractAddress,
    rootTransactionDetails.to,
    depth,
    rootTransaction,
    20,
  );
  const step1Data = { ...rootTransactionDetails, nextTransactions };
};

generateAttackReport(
  './output/test.json',
  '0x83db357ac4c7a1167052fcfbd59b9c116042b2dc5e005f1f1115b8c936531d52',
);
