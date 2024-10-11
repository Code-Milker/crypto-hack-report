import { ethers, InterfaceAbi } from "ethers";
import { ChainInfo, TransactionContext, TransactionContextPath } from "../types";
import { fetchBlockInfoFromTransaction, getBlockOneWeekAhead } from "../utils";
import { cacheAbi, getCachedAbi } from "../dbCalls/abi";

export async function fetchContractAbi(contractAddress: string, chainInfo: ChainInfo): Promise<string> {
  // First, check the cache with both the contractAddress and chainId
  const cachedAbi = await getCachedAbi(contractAddress, chainInfo.chainId);
  if (cachedAbi) {
    console.log(`Returning cached ABI for contract ${contractAddress} on chain ${chainInfo.chainId}`);
    return cachedAbi;
  }

  // If not in the cache, fetch from the block explorer API
  const url = `${chainInfo.blockExplorerApiUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${chainInfo.apiKey}`
  const response = await fetch(
    url
  );
  const data = await response.json();

  if (data.result && data.status === '1') {
    // Cache the ABI before returning it, using contractAddress and chainId
    await cacheAbi(contractAddress, chainInfo.chainId, data.result);
    return data.result;
  }

  throw new Error(`failed calling:  ${url} ` + (data.result || 'unknown error'));
}

export function getLinkToTransactions(transactionContext: TransactionContextPath): string {
  const formattedDate = new Date(transactionContext.timeStamp).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  if ('tokenContractAddress' in transactionContext) {
    return `https://etherscan.io/advanced-filter?fadd=${transactionContext.from}&tadd=${transactionContext.to}&age=${formattedDate}%7e${formattedDate}&tkn=${transactionContext?.tokenContractAddress}`;
  } else {
    return `todo for normal transactions`;
  }
}

// Fetch outgoing ETH transactions via Etherscan
export const fetchOutgoingEthTransactionsViaEtherscan = async (
  provider: ethers.Provider,
  account: string,
  fromTransactionHash: string, // Transaction hash to start from
  chainInfo: ChainInfo,
): Promise<TransactionContext[]> => {
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
    console.log(tx)
    const ethAmount = ethers.formatEther(tx.value);
    const transaction: TransactionContext = {
      transactionHash: tx.hash,
      from: tx.from,
      to: tx.to,
      amount: ethAmount,
      timeStamp: new Date(tx.timeStamp * 1000).toISOString(),
      blockNumber: tx.blockNumber,
      ensName: '', // Optionally add ENS lookup logic here
      receipt: {} as ethers.TransactionReceipt
    }
    return transaction;
  });

  return transactionDetails;
};
