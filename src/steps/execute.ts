import { ethers, } from 'ethers';
import { chainInfoMap } from '../info';
import { ChainId, ChainInfo, TransactionContext } from '../types';
import {
  delay
} from '../utils';
import { fetchContractAbi } from '../api/etherscan';
import { decodeLog, decodeMethod, fetchTransactionDetails, getContractBehindProxy } from '../api/rpc';

const run = async () => {
};
run();


