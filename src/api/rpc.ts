import { ethers } from 'ethers';
import {
  AddressInfo,
  AddressType,
  ChainInfo,
  DecodedMethod,
  DecodedParam,
  TokenInfo,
  TransactionContext,
  transactionSchema,
} from '../types';
import { fetchENSName } from '../utils';
import { WalletInformation, KnownWallets } from '../info';
import { DecodedLogs, decodeLogs } from '../data/transactions';
import { fetchContractAbi } from './etherscan';
import {
  cacheTransactionInformation,
  getCachedTransactionInformation,
} from '../dbCalls/transaction';

/**
 * Recursively processes input parameters (handles tuples and arrays).
 * @param input - The parameter type definition from the ABI.
 * @param value - The value to be decoded.
 * @param params - The array to push decoded parameters into.
 * @param parentName - The hierarchical name of the parameter.
 */
function processParams(
  input: ethers.ParamType,
  value: any,
  params: DecodedParam[], // Use DecodedParam interface
  parentName: string = '',
): void {
  const paramName = input.name || '';
  const fullName = parentName ? `${parentName}${paramName ? `.${paramName}` : ''}` : paramName;

  if (input.type.startsWith('tuple')) {
    if (input.components?.length) {
      // Process each component of the tuple
      input.components.forEach((component, index) => {
        if (value?.[index] !== undefined) {
          processParams(component, value[index], params, fullName);
        }
      });
    } else if (input.arrayChildren && input.arrayLength === -1) {
      // Handle arrays of tuples
      value.forEach((item: any, index: number) => {
        // @ts-ignore
        processParams(input.arrayChildren, item, params, `${fullName}[${index}]`);
      });
    }
  } else {
    // Add regular type input
    params.push({
      name: paramName,
      fullName: fullName,
      type: input.type,
      value: value,
    });
  }
}

/**
 * Decodes a transaction method call from its hash.
 * @param transactionHash - The hash of the transaction.
 * @param abi - The ABI to decode the transaction data.
 * @param provider - The provider to interact with the blockchain.
 * @returns Decoded method information.
 */
export async function decodeMethod(
  transactionHash: string,
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
): Promise<DecodedMethod | null> {
  const transaction = await provider.getTransaction(transactionHash);
  if (!transaction?.to) {
    return null;
  }
  const rootAddress = await getContractBehindProxy(transaction.to, provider);
  const contractAbi = rootAddress
    ? await fetchContractAbi(rootAddress, chain)
    : await fetchContractAbi(transaction.to, chain);
  if (contractAbi === '{}') {
    return null;
  }

  if (!transaction || !transaction.data) {
    throw new Error(`Transaction not found or invalid for hash: ${transactionHash}`);
  }

  // Create an interface using the ABI
  const iface = new ethers.Interface(JSON.parse(contractAbi));

  // Decode the input data from the transaction
  const decodedInput = iface.parseTransaction({ data: transaction.data });

  if (!decodedInput) {
    throw new Error('Unable to decode transaction');
  }
  const methodName = decodedInput.name; // Get the method name
  const func = iface.getFunction(methodName); // Get the function definition from the ABI

  if (!func) {
    console.error(`Function ${methodName} not found in ABI`);
    return null;
  }

  // Decode the function data
  const decodedFunctionData = iface.decodeFunctionData(func, transaction.data);

  // Build the params array by processing the function inputs
  const params: DecodedParam[] = [];
  func.inputs.forEach((input, index) => {
    processParams(input, decodedFunctionData[index], params);
  });

  // Return method name, parameters, and other useful data
  return {
    methodName,
    params,
    selector: func.selector,
    payable: func.payable,
  };
}

/**
 * Interface for the result of decoding a log.
 */
export interface DecodedLogResult {
  // log: ethers.Log;
  transactionHash: string;
  blockNumber: number;
  eventName: string;
  // decodedLog: ethers.Result;
  success: true;
  data: DecodedParam[]; // Decoded data
  topics: DecodedParam[]; // Decoded topics
  address: string;
}
export interface FailedDecodedLogResult {
  address: string;
  success: false;
}

/**
 * Decodes an event log entry from the blockchain.
 * @param log - The log entry to decode.
 * @param abi - The ABI used to decode the log.
 * @returns The decoded log details, including topics and data.
 */
export async function decodeLog(
  log: ethers.Log,
  abi: string,
): Promise<DecodedLogResult | FailedDecodedLogResult> {
  try {
    // Create an ethers.js Interface from the ABI
    const iface = new ethers.Interface(abi);

    // Find the event from the first topic (which is the hash of the event signature)
    const eventSignature = log.topics[0];
    const eventFragment = iface.getEvent(eventSignature);

    if (!eventFragment) {
      throw new Error('Event not found in ABI');
    }

    // Decode the log (indexed parameters come from `topics`, others from `data`)
    const decodedLog = iface.decodeEventLog(eventFragment, log.data, log.topics);
    const topics: DecodedParam[] = [];
    const data: DecodedParam[] = [];

    eventFragment.inputs.forEach((input, index) => {
      if (input.indexed) {
        processParams(input, decodedLog[index], topics);
      } else {
        processParams(input, decodedLog[index], data);
      }
    });
    return {
      success: true,
      topics,
      data,
      eventName: eventFragment.name,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
    };
  } catch (e) {
    return {
      address: log.transactionHash,
      success: false,
    };
  }
}

/**
 * Fetches detailed transaction information, including logs, ENS names, and more.
 * @param transactionHash - The hash of the transaction to fetch details for.
 * @param provider - The provider used to interact with the blockchain.
 * @returns Parsed transaction details in a `TransactionContext`.
 */
export const fetchTransaction = async (
  transactionHash: string,
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
): Promise<TransactionContext> => {
  const cache = await getCachedTransactionInformation(transactionHash, chain.chainId);
  if (cache !== null) {
    return cache;
  }
  // Fetch transaction details
  const transaction = await provider.getTransaction(transactionHash);

  // Validate transaction using Zod schema
  const validationResult = transactionSchema.safeParse(transaction);
  if (!validationResult.success) {
    throw new Error('Transaction validation failed');
  }
  const parsedTransaction = validationResult.data;

  // Fetch transaction receipt (for logs)
  const receipt = await provider.getTransactionReceipt(transactionHash);
  if (!receipt) {
    throw new Error(`Transaction receipt not found for ${transactionHash}`);
  }

  // Fetch ENS name, if available
  const ensName = await fetchENSName(parsedTransaction.to, provider);

  // Fetch block timestamp
  const timeStamp = await fetchBlockTimestamp(parsedTransaction.blockNumber, provider);

  // If the transaction involves ETH, format its value
  const formattedValue = ethers.formatEther(parsedTransaction.value);
  const to = await getAddressInformation(parsedTransaction.to, provider);
  const from = await getAddressInformation(parsedTransaction.from, provider);
  let decodedMethod: DecodedMethod | null = null;
  let decodedLogs: DecodedLogs | null = null;
  if (to.type === 'contract') {
    decodedMethod = await decodeMethod(transactionHash, provider, chain);
    decodedLogs = await decodeLogs(transactionHash, provider, chain);
  }
  const context: TransactionContext = {
    transactionHash,
    to: to,
    from: from,
    timeStamp,
    blockNumber: parsedTransaction.blockNumber ?? -1,
    ensName,
    value: parsedTransaction.value.toString(),
    formattedValue: formattedValue,
    logs: receipt.logs,
    status: receipt.status ?? 0,
    data: parsedTransaction.data,
    decodedMethod,
    decodedLogs,
  };
  cacheTransactionInformation(transactionHash, chain.chainId, context);
  return context;
};

/**
 * Retrieves the implementation address of a contract behind a proxy.
 * @param contractAddress - The proxy contract address.
 * @param provider - The provider used to interact with the blockchain.
 * @returns The address of the contract behind the proxy, or null if not a proxy.
 */
export async function getContractBehindProxy(
  contractAddress: string,
  provider: ethers.JsonRpcProvider,
): Promise<string | null> {
  const EIP1967_IMPLEMENTATION_SLOT =
    '0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC';
  try {
    // Check for UUPS proxies (with the `implementation()` function)
    const contract = new ethers.Contract(
      contractAddress,
      ['function implementation() public view returns (address)'],
      provider,
    );

    const impl = await contract.implementation().catch(() => null);

    // Check for EIP-1967 Implementation Slot
    const implementationAddress = await provider.getStorage(
      contractAddress,
      EIP1967_IMPLEMENTATION_SLOT,
    );
    const extractedAddress = '0x' + implementationAddress.slice(-40); // Extract last 40 hex characters

    // If the storage slot has a non-zero address, it's an EIP-1967 proxy
    if (extractedAddress !== ethers.ZeroAddress) {
      return extractedAddress;
    }

    // If there's a valid UUPS implementation address, return it
    if (impl && impl !== ethers.ZeroAddress) {
      return impl;
    }

    return null; // Not a proxy if no behavior is found
  } catch (err) {
    console.error('Error detecting proxy:', err);
    return null;
  }
}

export async function getTokenTransactionsFromAddressAfterBlock(
  provider: ethers.JsonRpcProvider,
  startBlockNumber: number,
  address: string,
  tokenContractAddress: string,
  limit = 100,
) {
  let currentBlockNumber = startBlockNumber;
  let transactions = [];

  while (transactions.length < limit) {
    const block = await provider.getBlock(currentBlockNumber);

    // Collect transactions from this block that match the specified address and token contract
    const filteredTransactions = block?.transactions.filter((tx) => {
      console.log(tx);
      // tx.from.toLowerCase() === address.toLowerCase() &&
      //   tx.to?.toLowerCase() === tokenContractAddress.toLowerCase()

      return true;
    });

    transactions.push(...(filteredTransactions ?? []));

    // Move to the next block
    currentBlockNumber++;

    // Stop if we already have enough transactions
    if (transactions.length >= limit) {
      break;
    }
  }

  // Return only the first 'limit' transactions
  return transactions.slice(0, limit);
}
export const getAddressInformation = async (
  address: string,
  provider: ethers.JsonRpcProvider,
): Promise<AddressInfo> => {
  const type: AddressType = (await provider.getCode(address)) !== '0x' ? 'contract' : 'EOA';
  let tokenInfo = null;
  const walletInfo = KnownWallets[address] ?? null;
  if (type === 'contract') {
    tokenInfo = await getTokenInfo(address, provider);
  }
  return { type, address, walletInfo, tokenInfo };
};
export const getTokenInfo = async (
  tokenAddress: string,
  provider: ethers.JsonRpcProvider,
): Promise<TokenInfo | null> => {
  const contract = new ethers.Contract(
    tokenAddress,
    [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
    ],
    provider,
  );

  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);

    return { name, symbol, decimals, totalSupply: totalSupply.toString() };
  } catch (error) {
    return null;
  }
};

export const fetchBlockTimestamp = async (
  blockNumber: number | null,
  provider: ethers.Provider,
) => {
  if (!blockNumber) return '';
  try {
    const block = await provider.getBlock(blockNumber);
    return block ? new Date(block.timestamp * 1000).toISOString() : '';
  } catch (error) {
    console.error(`Failed to fetch block for block number: ${blockNumber}`, error);
    return '';
  }
};

export async function getAverageBlockTime(provider: ethers.JsonRpcProvider): Promise<number> {
  try {
    // Get the latest block
    const latestBlock = await provider.getBlock('latest');
    if (!latestBlock) {
      throw new Error('Error fetching block time: unable to get latest block');
    }
    // Get a block from some blocks ago to calculate the time difference
    const previousBlock = await provider.getBlock(latestBlock?.number - 10); // Adjust this value if needed

    if (!previousBlock) {
      throw new Error('Error fetching block time: unable to get latest block');
    }

    // Calculate the block time in seconds
    const blockTime =
      (latestBlock.timestamp - previousBlock.timestamp) /
      (latestBlock.number - previousBlock.number);

    return blockTime;
  } catch (error) {
    console.error('Error fetching block time:', error);
    throw error;
  }
}
export async function getBlocksPerDay(provider: ethers.JsonRpcProvider): Promise<number> {
  try {
    const averageBlockTime = await getAverageBlockTime(provider);
    // Calculate blocks per day based on average block time
    console.log({ averageBlockTime });
    const blocksPerDay = 86400 / averageBlockTime;
    return Math.round(blocksPerDay);
  } catch (error) {
    console.error('Error calculating blocks per day:', error);
    throw error;
  }
}

export async function getBlockDaysAhead(
  startBlock: number,
  days: number,
  provider: ethers.JsonRpcProvider,
) {
  const blocksPerDay = await getBlocksPerDay(provider);
  const blocksInWeek = blocksPerDay * (days * 1.2);
  // Calculate the block number one week ahead
  const endBlock = startBlock + blocksInWeek;
  return endBlock;
}
