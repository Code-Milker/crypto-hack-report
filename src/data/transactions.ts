import { ethers } from 'ethers';
import { ChainInfo, TokenInfo, TransactionContext } from '../types';
import { delay, stringifyBigInt } from '../utils';
import {
  fetchContractAbi,
  fetchTransactionForAddress as fetchTransactionsForAddress,
} from '../api/etherscan';
import {
  decodeLog,
  decodeMethod,
  fetchTransaction,
  getContractBehindProxy,
  DecodedLogResult,
  FailedDecodedLogResult,
  getBlockDaysAhead,
  getAddressInformation,
  DecodedLogs,
} from '../api/rpc';
import {
  cacheTransactionInformation,
  getCachedTransactionInformation,
} from '../dbCalls/transaction';
import { KnownWallets } from '../info';
import { values } from 'lodash';
import { fetchTokenCoinGeckoData, getTokenId } from '../api/coinGecko';
import { TokenPriceUSD } from '../dbCalls/coinGeckoData';

// function sumTransactions(
//   transactions: FetchNativeTransaction[],
//   targetTransaction: FetchNativeTransaction,
// ) {
//   console.log(transactions[0].transactionContext.from, transactions[0].transactionContext.to)
//   const outgoingValue = BigInt(targetTransaction.transactionContext.value);
//   console.log({ outgoingValue })
//
//   // Calculate the allowed variance (2%)
//   const lowerBound = outgoingValue - (outgoingValue * BigInt(2)) / BigInt(100);
//   const upperBound = outgoingValue + (outgoingValue * BigInt(2)) / BigInt(100);
//
//   // Find a combination of transactions that sum to the outgoing transaction's value within the variance range
//   const result = findCombination(transactions, lowerBound, upperBound);
//
//   return result ? result : [];
// }

// Helper function to find a combination of transactions that sum to a target within a variance range
// function findCombination(
//   txs: FetchNativeTransaction[],
//   lowerBound: bigint,
//   upperBound: bigint,
//   combination: FetchNativeTransaction[] = [],
// ): FetchNativeTransaction[] | null {
//   const currentSum = combination.reduce((acc, tx) => acc + BigInt(tx.transactionContext.value), BigInt(0));
//
//   if (currentSum >= lowerBound && currentSum <= upperBound) {
//     return combination; // Success if the current sum is within the variance range
//   }
//
//   for (let i = 0; i < txs.length; i++) {
//     const tx = txs[i];
//     const newCombination = [...combination, tx];
//     const result = findCombination(txs.slice(i + 1), lowerBound, upperBound, newCombination);
//
//     if (result) {
//       return result; // Return the first valid combination
//     }
//   }
//
//   return null; // No combination found
// }
//
// function splitTransaction(
//   transactions: { from: string, value: string }[],
//   totalAmount: string,
//   fromAddress: string,
//   variance: number,
// ) {
//   let outgoingTxs: { from: string, value: string }[] = [];
//   let index = 0;
//
//   // Filter outgoing transactions manually using a while loop
//   while (index < transactions.length) {
//     if (transactions[index].from === fromAddress && transactions[index].value !== '0') {
//
//       outgoingTxs.push(transactions[index]);
//     }
//     index++;
//   }
//
//   const outgoingValue = BigInt(totalAmount);
//
//   // Calculate the allowed variance (2%)
//   const lowerBound = outgoingValue - (outgoingValue * BigInt(variance)) / BigInt(100);
//   const upperBound = outgoingValue + (outgoingValue * BigInt(variance)) / BigInt(100);
//
//   // Find a split of transactions that sum to the target outgoing value within the variance range
//   const result = findSplitCombination(outgoingTxs, lowerBound, upperBound);
//   return result ? result : [];
// }

// Helper function to find a split of transactions that sum to a target within a variance range
function findSplitCombination(
  txs: Array<{ from: string; value: string }>,
  lowerBound: bigint,
  upperBound: bigint,
  combination: Array<{ from: string; value: string }> = [],
): Array<{ from: string; value: string }> | null {
  const currentSum = combination.reduce((acc, tx) => acc + BigInt(tx.value), BigInt(0));
  // Check if current sum is within the range
  if (currentSum >= lowerBound && currentSum <= upperBound) {
    return combination; // Success if the current sum is within the variance range
  }

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const newCombination = [...combination, tx];
    const result = findSplitCombination(txs.slice(i + 1), lowerBound, upperBound, newCombination);

    if (result) {
      return result; // Return the first valid split combination
    }
  }

  return null; // No valid split combination found
}
// export const fetchTransactionInteractionInformation = async (
//   transactionHash: string,
//   provider: ethers.JsonRpcProvider,
//   chain: ChainInfo,
// ) => {
//   const transactionInformation = await fetchTransactionInformation(
//     transactionHash,
//     provider,
//     chain,
//   );
//
//   const endBlock = getBlockDaysAhead(transactionInformation.context.blockNumber, 10);
//
//   const transactionsForAddress = await fetchTransactionForAddress(
//     transactionInformation.context.to.address,
//     transactionInformation.context.blockNumber,
//     endBlock,
//     chain
//   );
//   const nativeTransactions: FetchNativeTransaction[] = [];
//   const contractTransactions: FetchContractTransaction[] = [];
//   for (const t of transactionsForAddress) {
//     if (t.hash === transactionHash) {
//       continue
//     }
//     // sort transactions by event type
//     const transactionInformationToAddress = await fetchTransactionInformation(
//       t.hash,
//       provider,
//       chain,
//     );
//     if (transactionInformationToAddress.transactionType === 'nativeTransfer') {
//       const usdData = await fetchTokenCoinGeckoData(chain.nativeCurrency.name, chain)
//       const inRange = await isTokenTransferWithinRange(Number(transactionInformation.transactionContext.value), Number(t.value), 5, usdData)
//       const nativeTransaction = transactionInformationToAddress as FetchNativeTransaction;
//       if (inRange) {
//         nativeTransactions.push({ ...transactionInformationToAddress, transactionType: 'directTransfer' });
//         continue
//       }
//       nativeTransactions.push(nativeTransaction);
//     } else if (transactionInformationToAddress.transactionType[0] === 'contractCall') {
//       const contractTransaction = transactionInformationToAddress as FetchContractTransaction;
//       if (contractTransaction.method?.methodName === 'Transfer') {
//         contractTransactions.push({
//           ...contractTransaction,
//           transactionType: 'transfer',
//         });
//       } else {
//         contractTransactions.push({
//           ...contractTransaction,
//           transactionType: 'method',
//         });
//       }
//     }
//
//   }
//   return {
//     transactionInformation,
//     nativeTransactions,
//     contractTransactions,
//   };
// };

// interface TransactionInformationNode {
//   transactionInformation: FetchContractTransaction | FetchNativeTransaction;
//   nativeTransactions: FetchNativeTransaction[];
//   contractTransactions: FetchContractTransaction[];
//   next?: TransactionInformationNode
//   exitReason?: 'unknown' | 'depth-limit-reached' | 'CEX-Specific'
//
// }

// export function flattenTransactions(node: TransactionInformationNode): TransactionInformationNode[] {
//   const { next, ...onlyNode } = node
//   let transactions: TransactionInformationNode[] = [onlyNode];
//
//   // Recursively flatten the next node if it exists
//   if (node.next) {
//     transactions = transactions.concat(flattenTransactions(node.next));
//   }
//
//   return transactions;
// }
// lets get this path spitting out correctly for native

const addressToApiName = {
  '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE': 'spooky-token', // Example: SpookyToken (BOO)
  '0x3Fd3A0c85B70754eFc07aC9Ac0cbBDCe664865A6': 'equalizer', // Example: Equalizer (EQUAL)
  '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83': 'wrapped-fantom', // Example: Wrapped Fantom (WFTM)
  '0x1B6382DBDEa11d97f24495C9A90b7c88469134a4': 'axelar-usdc', // Example: Axelar Wrapped USDC (axlUSDC)
  '0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf': 'usd-coin', // Example: USD Coin (USDC)
};

interface NativeTransaction {
  transactionHash: string;
  from: string;
  to: string;
  value: string; // The raw value as a string
  formattedAmount: string; // The value formatted using ethers.formatEther
  tokenPriceUSD: TokenPriceUSD;
}
interface TokenTransaction {
  transactionHash: string;
  tokenPriceUSD: TokenPriceUSD;
  tokenName?: string; // Optional if info.to.tokenInfo?.name is undefined
  tokenSymbol?: string; // Optional if info.to.tokenInfo?.symbol is undefined
  tokenAddress: string;
  from: string;
  to: string;
  value: string; // The raw value as a string
  formattedAmount: string;
  log?: DecodedLogResult;
}
const isTransfer = (l: DecodedLogResult) => {
  const from = l.topics[0];
  const to = l.topics[1];
  const value = l.data[0];
  return !(from?.name !== 'from' || to?.name !== 'to' || value.name !== 'value')
    ? { from, to, value }
    : null;
};
interface AddressTransactionContext {
  tokenTransferContext: { [tokenAddress: string]: { [hash: string]: TokenTransaction[] } };
  nativeTransferContext: NativeTransaction[];
  contractTransferContext: { [tokenAddress: string]: { [hash: string]: { contractLogs: TokenTransaction[], methodName: string } } };
  children: AddressTransactionContext[];
}
export const fetchAddressContext = async (
  startBlock: number,
  endBlock: number,
  address: string,
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
): Promise<AddressTransactionContext> => {
  const transactions = await fetchTransactionsForAddress(address, startBlock, endBlock, chain);
  const tokenTransferContext: {
    [key: string]: { [key: string]: TokenTransaction[] }
  } = {};
  const nativeTransferContext: NativeTransaction[] = [];
  const contractTransferContext: { [key: string]: { [key: string]: { contractLogs: TokenTransaction[], methodName: string } } } = {};
  for (const t of transactions) {
    const info = await fetchTransaction(t.hash, provider, chain);
    if (info.to.type === 'EOA') {
      const tokenApiId = await getTokenId(chain.nativeCurrency.symbol.toLowerCase());
      if (!tokenApiId) {
        continue;
      }
      const tokenPrice = await fetchTokenCoinGeckoData(tokenApiId.id, chain);
      nativeTransferContext.push({
        transactionHash: t.hash,
        from: t.from,
        to: t.to,
        value: t.value,
        formattedAmount: ethers.formatEther(t.value),
        tokenPriceUSD: {
          ...tokenPrice,
          AmountInUSD: Number(tokenPrice.usd) * Number(ethers.formatEther(t.value)),
        },
      });
    }

    if (info.to.type === 'contract' && info.decodedMethod?.methodName === 'transfer') {
      for (const d of info.decodedLogs?.decodedLogs ?? []) {
        const from = d.topics[0];
        const to = d.topics[1];
        const value = d.data[0];
        if (from?.name !== 'from' || to?.name !== 'to' || value.name !== 'value') {
          continue; // not a standard erc-20
        }

        if (!tokenTransferContext[info.to.address]) {
          tokenTransferContext[info.to.address] = {
          }
        }

        if (!tokenTransferContext[info.to.address][d.transactionHash]) {
          tokenTransferContext[info.to.address][d.transactionHash] = []
        }

        const tokenApiId = await getTokenId(info.to.tokenInfo?.symbol as string);
        if (!tokenApiId) {
          continue;
        }
        const tokenPrice = await fetchTokenCoinGeckoData(tokenApiId.id, chain);
        const formattedAmount = ethers.formatUnits(
          value.value,
          Number(info.to.tokenInfo?.decimals),
        );
        tokenTransferContext[info.to.address][d.transactionHash].push({
          tokenPriceUSD: {
            ...tokenPrice,
            AmountInUSD: Number(tokenPrice.usd) * Number(formattedAmount),
          },
          transactionHash: d.transactionHash,
          tokenName: info.to.tokenInfo?.name,
          tokenSymbol: info.to.tokenInfo?.symbol,
          tokenAddress: info.to.address,
          from: from.value,
          to: to.value,
          value: value.value,
          formattedAmount,
          log: d
        });
      }
    } else if (info.to.type === 'contract') {
      if (!info.decodedLogs?.decodedLogs) {
        continue;
      }

      const contractLogs = []
      for (const l of info.decodedLogs.decodedLogs) {
        const transfer = isTransfer(l);
        if (!transfer) {
          continue;
        }
        if (transfer.to.value !== info.from.address && transfer.from.value !== info.from.address) {
          continue;
        }

        const addressInfo = await getAddressInformation(l.address, provider);

        if (!addressInfo.tokenInfo?.symbol) {
          continue;
        }
        const tokenApiId = await getTokenId(addressInfo.tokenInfo?.symbol);
        if (!tokenApiId) {
          continue;
        }
        const tokenPrice = await fetchTokenCoinGeckoData(tokenApiId.id, chain);
        const formattedAmount = ethers.formatUnits(
          transfer.value.value,
          Number(addressInfo.tokenInfo?.decimals),
        );
        contractLogs.push({
          log: l,
          tokenPriceUSD: {
            ...tokenPrice,
            AmountInUSD: Number(tokenPrice.usd) * Number(formattedAmount),
          },
          transactionHash: l.transactionHash,
          tokenName: addressInfo.tokenInfo?.name,
          tokenSymbol: addressInfo.tokenInfo?.symbol,
          tokenAddress: addressInfo.address,
          from: transfer.from.value,
          to: transfer.to.value,
          value: transfer.value.value,
          formattedAmount,
        });
      }
      if (!contractTransferContext[info.to.address]) {
        contractTransferContext[info.to.address] = {}
      }


      contractTransferContext[info.to.address][info.transactionHash] = { contractLogs, methodName: info.decodedMethod?.methodName as string, }
    }
  }

  let addressContext: AddressTransactionContext = {
    tokenTransferContext,
    nativeTransferContext,
    contractTransferContext,
    children: [],
  };

  const moneyFlow: {
    [tokenAddress: string]: {
      inUSD: number,
      in: number,
      outUSD: number,
      out: number,
      tokenName: string
      transactions: (TokenTransaction | NativeTransaction)[]
    }
  } = {}
  // {
  //     inUSD: 0,
  //     amountin: 0,
  //     outUSD: 0,
  //     amountOut: 0
  //   }
  for (const transfer of nativeTransferContext) {
    if (!moneyFlow['native']) {
      moneyFlow['native'] = {
        inUSD: 0,
        in: 0,
        outUSD: 0,
        out: 0,
        tokenName: 'native',
        transactions: []
      }
    }

    if (transfer.to.toLowerCase() === address.toLowerCase()) { // incoming
      moneyFlow['native'].inUSD = moneyFlow['native'].inUSD + (transfer.tokenPriceUSD.AmountInUSD ?? 0)
      moneyFlow['native'].in = moneyFlow['native'].in + Number((transfer.formattedAmount ?? 0))
    }
    if (transfer.from.toLowerCase() === address.toLowerCase()) { // outgoing
      moneyFlow['native'].outUSD = moneyFlow['native'].outUSD + (transfer.tokenPriceUSD.AmountInUSD ?? 0)
      moneyFlow['native'].out = moneyFlow['native'].out + Number((transfer.formattedAmount ?? 0))

      moneyFlow['native'].transactions.push(transfer)
    }
    // console.log(native);
  }
  for (const contractAddress of Object.keys(contractTransferContext)) {
    for (const hash of Object.keys(contractTransferContext[contractAddress])) {
      for (const transfer of (contractTransferContext[contractAddress][hash].contractLogs)) {
        if (!moneyFlow[transfer.tokenAddress]) {
          moneyFlow[transfer.tokenAddress] = {
            inUSD: 0,
            in: 0,
            outUSD: 0,
            out: 0,
            tokenName: transfer.tokenName as string,
            transactions: []
          }
        }
        if (transfer.to === address) { // sent in
          moneyFlow[transfer.tokenAddress].inUSD = moneyFlow[transfer.tokenAddress].inUSD + (transfer.tokenPriceUSD.AmountInUSD ?? 0)
          moneyFlow[transfer.tokenAddress].in = moneyFlow[transfer.tokenAddress].in + Number((transfer.formattedAmount ?? 0))
          moneyFlow[transfer.tokenAddress].transactions.push(transfer)
        }
        if (transfer.from === address) { // sent out

          moneyFlow[transfer.tokenAddress].outUSD = moneyFlow[transfer.tokenAddress].outUSD + (transfer.tokenPriceUSD.AmountInUSD ?? 0)
          moneyFlow[transfer.tokenAddress].out = moneyFlow[transfer.tokenAddress].out + Number((transfer.formattedAmount ?? 0))
          moneyFlow[transfer.tokenAddress].tokenName = transfer.tokenName as string
          moneyFlow[transfer.tokenAddress].transactions.push(transfer)
        }
      }
      // contractTransferContext[hash]
      //   console.log(log)
      //   // console.log(log.tokenPriceUSD.AmountInUSD)
      //   // totalAmountInUSD = totalAmountInUSD + (log.tokenPriceUSD.AmountInUSD ?? 0)
      // } else {
      //   console.log('in')
      // }
    }
  }

  for (const tokenAddress of Object.keys(tokenTransferContext)) {
    if (!moneyFlow[tokenAddress]) {
      moneyFlow[tokenAddress] = {
        inUSD: 0,
        in: 0,
        outUSD: 0,
        out: 0,
        tokenName: '',
        transactions: []
      }
    }
    for (const hash of Object.keys(tokenTransferContext[tokenAddress])) {
      for (const transfer of tokenTransferContext[tokenAddress][hash]) {
        if (transfer.to === address) { // sent in
          moneyFlow[tokenAddress].inUSD = moneyFlow[tokenAddress].inUSD + (transfer.tokenPriceUSD.AmountInUSD ?? 0)
          moneyFlow[tokenAddress].in = moneyFlow[tokenAddress].in + Number((transfer.formattedAmount ?? 0))
          moneyFlow[tokenAddress].transactions.push(transfer)
        }
        if (transfer.from === address) { // sent out
          moneyFlow[tokenAddress].outUSD = moneyFlow[tokenAddress].outUSD + (transfer.tokenPriceUSD.AmountInUSD ?? 0)
          moneyFlow[tokenAddress].out = moneyFlow[tokenAddress].out + Number((transfer.formattedAmount ?? 0))
          moneyFlow[tokenAddress].tokenName = transfer.tokenName as string
          moneyFlow[tokenAddress].transactions.push(transfer)
        }
      }

      // console.log(tokenTransferContext[tokenAddress][hash])
      // contractTransferContext[hash]
      // if (log.to, address) { // sent out
      //   console.log(log)
      //   // console.log(log.tokenPriceUSD.AmountInUSD)
      //   // totalAmountInUSD = totalAmountInUSD + (log.tokenPriceUSD.AmountInUSD ?? 0)
      // } else {
      //   console.log('in')
      // }
    }

  }



  console.log(moneyFlow['0x3Fd3A0c85B70754eFc07aC9Ac0cbBDCe664865A6'])
  return addressContext;
};
