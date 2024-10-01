import { ethers } from 'ethers';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { fetchTransactionDetails } from './utils';
import { TransactionPathWithContext } from './types';
import path from 'path';
// 0xaa178b10a3a37bab88fe5947950c314ebab98af1c5e4ef79a8f850bdf5a5a176
// 0x3bf43a4089ef9b18263efe934b710b65c6d4d80f5635404e0c1485017c14ae39
//0x62daaf829021c507075369bd4464d0dcacdbe92e95ab32ef5155d83ee9f388a0
// Define the ERC20 ABI with the decimals function
const erc20ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

const fetchBlockInfoFromTransaction = async (txHash: string): Promise<ethers.Block> => {
  // Step 1: Fetch transaction receipt
  const txReceipt = await provider.getTransactionReceipt(txHash);

  if (!txReceipt) {
    throw Error('Transaction not found');
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

// Fetch only outgoing token transactions for a specific account
const fetchOutgoingTokenTransactions = async (
  provider: ethers.JsonRpcProvider,
  tokenContractAddress: string,
  account: string,
  fromTransactionHash: string, // Optional starting transaction hash to filter from
  transactionLimit: number,
) => {
  const block = await fetchBlockInfoFromTransaction(fromTransactionHash);
  const tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider);
  const decimals = await tokenContract.decimals();
  const transferFilterOutgoing = tokenContract.filters.Transfer(account, null); // Only outgoing transfers

  // Fetch all outgoing events for the account
  const eventsOutgoing = await tokenContract.queryFilter(transferFilterOutgoing, block.number);
  const transactionDetails: TransactionPathWithContext[] = await Promise.all(
    eventsOutgoing
      .sort((a, b) => a.blockNumber - b.blockNumber)
      .slice(0, transactionLimit)
      .map(async (event) => {
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
  console.log('at depth: ', depth)
  console.log('fetching for transaction', fromTransactionHash)
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
const generateAttackReport = async (fileName: string, rootTransaction: string,) => {
  const depth = 5; // Recursion depth
  const rootTransactionDetails = await fetchTransactionDetails(
    rootTransaction,
    provider,
  ) as TransactionPathWithContext
  const nextTransactions = await recursiveFetchTransactions(
    provider,
    rootTransactionDetails.tokenContractAddress,
    rootTransactionDetails.to,
    depth,
    rootTransaction,
    50,
  );
  const attackTransactionPath = { ...rootTransactionDetails, nextTransactions }
  console.log('writing file to: ', fileName)

  const dirPath = path.dirname(fileName);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true }); // Create directory if it doesn't exist
  }

  if (existsSync(fileName)) {
    unlinkSync(fileName);
  }
  writeFileSync(fileName, JSON.stringify(attackTransactionPath, null, 2));
}


generateAttackReport('./output/test.json', '0x83db357ac4c7a1167052fcfbd59b9c116042b2dc5e005f1f1115b8c936531d52')
