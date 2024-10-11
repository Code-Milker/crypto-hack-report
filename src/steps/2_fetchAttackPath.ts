import { ChainInfo, TransactionContext, TransactionContextPath, } from '../types';
import { fetchStepData, writeStepDataWithTransactionHashIndex } from './db';
import { AttackedInformation } from '../data/attackInformation';
import { getLinkToTransactions } from '../api/etherscan';


const followTransactionFlow = (
  transaction: TransactionContextPath,
  transactionContextPath: TransactionContextPath[],
  startAt: number | null,
): { transactionContextPath: TransactionContextPath[]; tokenSplitOrCombinationHash?: { link: string, manuallyUpdatedTransaction: string } } => {
  const matchingTransactions = transaction.nextTransactions
    .filter((t) => {
      return (
        t.tokenContractAddress === transaction.tokenContractAddress &&
        t.amount === transaction.amount
      );
    })
    .sort((a, b) => a.blockNumber - b.blockNumber);
  if (matchingTransactions.length) {
    const matchingTransaction = matchingTransactions[0];
    return followTransactionFlow(
      matchingTransaction,
      [{ ...matchingTransaction, nextTransactions: [] }, ...transactionContextPath],
      null,
    );
  } else if (startAt !== null) {
    return followTransactionFlow(
      transaction.nextTransactions[startAt],
      [
        { ...transaction.nextTransactions[startAt], nextTransactions: [] },
        ...transactionContextPath,
      ],
      null,
    );
  } else {
    return {
      transactionContextPath: transactionContextPath.reverse(),
      tokenSplitOrCombinationHash: { link: getLinkToTransactions(transaction), manuallyUpdatedTransaction: '' },
    };
  }
};

// Main function to process the transaction
export async function processTransaction(
  data: TransactionContextPath,
): Promise<
  { transactionContextPath: TransactionContextPath[]; tokenSplitOrCombinationHash?: { link: string, manuallyUpdatedTransaction: string } }[]
> {
  // const transactionData = readTransactionData(filePath);
  // The root's children represent initial fund splitting, so we handle it differently
  const paths = await Promise.all(
    data.nextTransactions.map((_t, i) => {
      const { nextTransactions, ...root } = data;
      return followTransactionFlow(data, [{ ...root, nextTransactions: [] }], i);
    }),
  );

  return paths;
}
export const step2 = async () => {
  const data: { [transactionHash: string]: TransactionContextPath } = await fetchStepData(1);
  const step0Data: AttackedInformation[] = await fetchStepData(0)
  const res = await Promise.all(
    Object.keys(data).map(async (transactionHash) => {
      // console.log(data[transaction])
      const transactionContextPath = await processTransaction(data[transactionHash]);
      let chainInfo: ChainInfo | {} = {};
      step0Data.forEach(a => {
        a.chains.forEach(c => {
          c.attackRootTransactionHashes.forEach(att => {
            if (att === transactionHash) {
              chainInfo = c.chainInfo
            }
          }
          )
        })
      })
      // console.log(chainInfo)
      return {
        transactionHash: data[transactionHash].transactionHash, payload: { transactionContextPath, chainInfo: chainInfo }
      }
    }),
  );
  for (const t of res) {
    console.log(t.payload)
    // await writeStepDataWithTransactionHashIndex(2, t.payload, t.transactionHash);
  }
};

// Example usage
