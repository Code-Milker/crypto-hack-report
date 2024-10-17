import { ethers, InterfaceAbi } from 'ethers';
import { ChainInfo, TransactionContext, TransactionContextPath } from '../types';
import { delay, } from '../utils';
import { cacheAbi, getCachedAbi } from '../dbCalls/abi';

export async function fetchContractAbi(
  contractAddress: string,
  chainInfo: ChainInfo,
): Promise<string> {
  // First, check the cache with both the contractAddress and chainId
  const cachedAbi = await getCachedAbi(contractAddress, chainInfo.chainId);
  if (cachedAbi) {
    console.log(
      `Returning cached ABI for contract ${contractAddress} on chain ${chainInfo.chainId}`,
    );
    return cachedAbi;
  }

  // If not in the cache, fetch from the block explorer API
  const url = `${chainInfo.blockExplorerApiUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${chainInfo.apiKey}`;
  console.log(url);
  const response = await fetch(url);
  const data = await response.json();

  if (data.result && data.status === '1') {
    // Cache the ABI before returning it, using contractAddress and chainId
    await cacheAbi(contractAddress, chainInfo.chainId, data.result);
    return data.result;
  } else {
    cacheAbi(contractAddress, chainInfo.chainId, '{}');
    throw Error('abi cannot be found for: ' + contractAddress);
  }
}

export function getLinkToTransactions(transactionContext: TransactionContextPath): string {
  const formattedDate = new Date(transactionContext.timeStamp).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  if ('tokenContractAddress' in transactionContext) {
    return `https://etherscan.io/advanced-filter?fadd=${transactionContext.from}&tadd=${transactionContext.to.address}&age=${formattedDate}%7e${formattedDate}&tkn=${transactionContext?.tokenContractAddress}`;
  } else {
    return `todo for normal transactions`;
  }
}

export interface TransactionDetails {
  blockNumber: string;
  blockHash: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  methodId: string;
  functionName: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  txreceipt_status: string;
  gasUsed: string;
  confirmations: string;
  isError: string;
}
export async function fetchTransactionForAddress(
  address: string,
  endBlock: number,
  chainInfo: ChainInfo,
): Promise<TransactionDetails[]> {
  await delay(300);
  const url = `${chainInfo.blockExplorerApiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=${endBlock}&sort=asc&offset=500&apikey=${chainInfo.apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status !== '1') {
    throw new Error('Error fetching transactions from Etherscan: ' + data.message);
  }
  const nativeTransactions = data.result;
  return nativeTransactions;
}
