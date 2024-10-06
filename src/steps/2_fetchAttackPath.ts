import * as fs from 'fs';
import { TransactionContext, TransactionContextPath, TransactionPathWithContext } from '../types';
import { fetchStepData, writeStepDataWithTransactionHashIndex } from './db';

// Function to construct the Etherscan filter link
function getEtherscanLink(transactionContext: TransactionContextPath): string {
  const formattedDate = new Date(transactionContext.timeStamp).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  return `https://etherscan.io/advanced-filter?fadd=${transactionContext.from}&tadd=${transactionContext.to}&age=${formattedDate}%7e${formattedDate}&tkn=${transactionContext.tokenContractAddress}`;
}

// Recursive function to follow the transaction path

const followTransactionFlow = (
  transaction: TransactionContextPath,
  transactionContextPath: TransactionContextPath[],
  startAt: number | null,
): { transactionContextPath: TransactionContextPath[]; tokenSplitOrCombinationHash?: string } => {
  const matchingTransactions = transaction.nextTransactions
    .filter((t) => {
      return (
        t.tokenContractAddress === transaction.tokenContractAddress &&
        t.tokenAmount === transaction.tokenAmount
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
      tokenSplitOrCombinationHash: getEtherscanLink(transaction),
    };
  }
};

// Main function to process the transaction
export async function processTransaction(
  data: TransactionContextPath,
): Promise<
  { transactionContextPath: TransactionContextPath[]; tokenSplitOrCombinationHash?: string }[]
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
  const res = await Promise.all(
    Object.keys(data).map(async (transaction) => {
      // console.log(data[transaction])
      const transactionContextPath = await processTransaction(data[transaction]);
      return { transactionHash: data[transaction].transactionHash, transactionContextPath };
    }),
  );
  for (const t of res) {
    await writeStepDataWithTransactionHashIndex(2, t.transactionContextPath, t.transactionHash);
  }
};
// Example usage
