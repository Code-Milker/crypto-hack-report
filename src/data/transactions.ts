
import { ethers, } from 'ethers';
import { ChainInfo, TransactionContext } from '../types';
import {
  delay
} from '../utils';
import { fetchContractAbi } from '../api/etherscan';
import { decodeLog, decodeMethod, fetchTransactionDetails, getContractBehindProxy } from '../api/rpc';
export const fetchMethodInformationByTransactionHash = async (transactionHash: string, provider: ethers.JsonRpcProvider, chain: ChainInfo) => {
  const rootTransactionDetails: TransactionContext = await fetchTransactionDetails(transactionHash, provider);
  const rootAddress = await getContractBehindProxy(rootTransactionDetails.to, provider)
  let decodedMethod;
  if (rootAddress) {
    const contractAbi = await fetchContractAbi(rootAddress, chain)
    decodedMethod = await decodeMethod(transactionHash, contractAbi, provider)
  } else {
    const contractAbi = await fetchContractAbi(rootTransactionDetails.to, chain)
    decodedMethod = await decodeMethod(transactionHash, contractAbi, provider)
  }
  return decodedMethod
}

export const fetchEventInformationByTransactionHash = async (transactionHash: string, provider: ethers.JsonRpcProvider, chain: ChainInfo) => {
  const rootTransactionDetails: TransactionContext = await fetchTransactionDetails(transactionHash, provider);

  const decodedLogs = []
  const failedDecodedlogs = []
  for (const l of rootTransactionDetails.receipt.logs) {
    await delay(401)
    const rootAddress = await getContractBehindProxy(l.address, provider)
    if (rootAddress) {
      const logAbi = await fetchContractAbi(rootAddress, chain)
      const decodedLog = await decodeLog(l, logAbi)
      if (decodedLog.success) {
        decodedLogs.push(decodedLog)
      } else {
        failedDecodedlogs.push(decodedLog)
      }
    } else {
      const logAbi = await fetchContractAbi(l.address, chain)
      const decodedLog = await decodeLog(l, logAbi)
      if (decodedLog.success) {
        decodedLogs.push(decodedLog)
      } else {
        failedDecodedlogs.push(decodedLog)
      }
    }
  }
  return { decodedLogs, failedDecodedlogs }
}


