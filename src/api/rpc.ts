import { ethers } from "ethers";
import { AddressType, DecodedParam, TransactionContext, transactionSchema } from "../types";
import { fetchENSName, fetchBlockTimestamp } from "../utils";

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
  parentName: string = ''
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
      value: value
    });
  }
}

/**
 * Interface for the result of decoding a method.
 */
interface DecodedMethodResult {
  methodName: string;
  params: DecodedParam[];
  selector: string;
  payable: boolean;
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
  abi: string,
  provider: ethers.Provider
): Promise<DecodedMethodResult> {
  // Fetch the transaction using the transaction hash
  const transaction = await provider.getTransaction(transactionHash);

  if (!transaction || !transaction.data) {
    throw new Error(`Transaction not found or invalid for hash: ${transactionHash}`);
  }

  // Create an interface using the ABI
  const iface = new ethers.Interface(JSON.parse(abi));

  // Decode the input data from the transaction
  const decodedInput = iface.parseTransaction({ data: transaction.data });

  if (!decodedInput) {
    throw new Error('Unable to decode transaction');
  }

  const methodName = decodedInput.name; // Get the method name
  const func = iface.getFunction(methodName); // Get the function definition from the ABI

  if (!func) {
    throw new Error(`Function ${methodName} not found in ABI`);
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
    payable: func.payable
  };
}

/**
 * Interface for the result of decoding a log.
 */
interface DecodedLogResult {
  log: ethers.Log;
  eventName: string;
  decodedLog: ethers.Result;
  success: true;
  data: DecodedParam[]; // Decoded data
  topics: DecodedParam[]; // Decoded topics
}

/**
 * Decodes an event log entry from the blockchain.
 * @param log - The log entry to decode.
 * @param abi - The ABI used to decode the log.
 * @returns The decoded log details, including topics and data.
 */
export async function decodeLog(log: ethers.Log, abi: string): Promise<DecodedLogResult | { log: ethers.Log, success: false }> {
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
      decodedLog,
      log
    };

  } catch (e) {
    return {
      success: false,
      log
    };
  }
}

/**
 * Fetches detailed transaction information, including logs, ENS names, and more.
 * @param transactionHash - The hash of the transaction to fetch details for.
 * @param provider - The provider used to interact with the blockchain.
 * @returns Parsed transaction details in a `TransactionContext`.
 */
export const fetchTransactionDetails = async (
  transactionHash: string,
  provider: ethers.JsonRpcProvider,
): Promise<TransactionContext> => {
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
  const ethAmount = ethers.formatEther(parsedTransaction.value);
  const toType = await getAddressType(parsedTransaction.to, provider)
  const fromType = await getAddressType(parsedTransaction.from, provider)
  const res: TransactionContext = {
    transactionHash,
    to: { type: toType, address: parsedTransaction.to },
    from: { type: fromType, address: parsedTransaction.from },
    timeStamp,
    blockNumber: parsedTransaction.blockNumber ?? -1,
    ensName,
    amount: ethAmount,
    receipt: receipt
  }
  return res;
};

/**
 * Retrieves the implementation address of a contract behind a proxy.
 * @param contractAddress - The proxy contract address.
 * @param provider - The provider used to interact with the blockchain.
 * @returns The address of the contract behind the proxy, or null if not a proxy.
 */
export async function getContractBehindProxy(contractAddress: string, provider: ethers.JsonRpcProvider): Promise<string | null> {
  const EIP1967_IMPLEMENTATION_SLOT = '0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC';
  try {
    // Check for UUPS proxies (with the `implementation()` function)
    const contract = new ethers.Contract(contractAddress, [
      'function implementation() public view returns (address)',
    ], provider);

    const impl = await contract.implementation().catch(() => null);

    // Check for EIP-1967 Implementation Slot
    const implementationAddress = await provider.getStorage(contractAddress, EIP1967_IMPLEMENTATION_SLOT);
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

export async function getAddressType(address: string, provider: ethers.JsonRpcProvider): Promise<AddressType> {
  const code = await provider.getCode(address);
  return code === '0x' ? 'EOA' : 'contract'  // '0x' means it's a regular wallet, anything else indicates a contract
}
