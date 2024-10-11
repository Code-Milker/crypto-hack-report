
import { ethers, } from 'ethers';
import { ChainInfo, TransactionContext } from '../types';
import {
  delay
} from '../utils';
import { fetchContractAbi } from '../api/etherscan';
import { decodeLog, decodeMethod, fetchTransactionDetails, getContractBehindProxy, getAddressType } from '../api/rpc';
import { cacheTransactionInformation, getCachedTransactionInformation } from '../dbCalls/transaction';
export const fetchMethodInformationByTransactionHash = async (transactionHash: string, provider: ethers.JsonRpcProvider, chain: ChainInfo) => {
  const rootTransactionDetails: TransactionContext = await fetchTransactionDetails(transactionHash, provider);
  const rootAddress = await getContractBehindProxy(rootTransactionDetails.to.address, provider)
  let decodedMethod;
  if (rootAddress) {
    const contractAbi = await fetchContractAbi(rootAddress, chain)
    decodedMethod = await decodeMethod(transactionHash, contractAbi, provider)
  } else {
    const contractAbi = await fetchContractAbi(rootTransactionDetails.to.address, chain)
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

export const fetchTransactionInformationFromAttackInformation = async (params: { transactionHash: string, }, provider: ethers.JsonRpcProvider, chain: ChainInfo) => {
  const cachedTransactionInformation = await getCachedTransactionInformation(params.transactionHash, chain.chainId)
  if (cachedTransactionInformation !== null) {
    return cachedTransactionInformation
  }

  const rootTransactionDetails: TransactionContext = await fetchTransactionDetails(params.transactionHash, provider);
  const events = await fetchEventInformationByTransactionHash(params.transactionHash, provider, chain)
  let method;
  if (rootTransactionDetails.to.type === 'contract') {
    method = await fetchMethodInformationByTransactionHash(params.transactionHash, provider, chain)
  } else {
    method = null
  }
  cacheTransactionInformation(params.transactionHash, chain.chainId, { events, method })
  return { events, method }

}
