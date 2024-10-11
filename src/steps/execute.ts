import { ethers, } from 'ethers';
import { chainInfoMap } from '../info';
import { ChainId, ChainInfo, TransactionContext } from '../types';
import {
  delay
} from '../utils';
import { fetchContractAbi } from '../api/etherscan';
import { decodeLog, decodeMethod, fetchTransactionDetails, getContractBehindProxy } from '../api/rpc';
import { generateRootAttackInformation } from '../data/attackInformation';
import { fetchTransactionInformationFromAttackInformation } from '../data/transactions';

const run = async () => {
  const attackInformation = await generateRootAttackInformation()
  // console.log(attackInformation)
  for (const attack of attackInformation) {
    for (const chain of attack.chains) {
      const provider = new ethers.JsonRpcProvider(chain.chainInfo.rpcUrl)
      for (const transactionHash of chain.attackRootTransactionHashes) {
        if (chain.chainId === 250) {

          try {
            console.log('starting: ', transactionHash);
            const transactionInformation = await fetchTransactionInformationFromAttackInformation({ transactionHash, }, provider, chain.chainInfo);
            console.log(transactionInformation)
            console.log('success: ', transactionHash);
          } catch {
            console.log('fail: ', transactionHash);
          }
        }
      }
    }
  }
  // console.log(transactionInfromation)
};
run();


