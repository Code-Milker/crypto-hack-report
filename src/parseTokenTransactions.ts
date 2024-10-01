import * as fs from 'fs';
import { TransactionContext, TransactionContextPath } from './types';



// Function to read JSON file and parse it
function readTransactionData(filePath: string): TransactionContextPath {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawData);
}

// Function to construct the Etherscan filter link
function getEtherscanLink(transactionContext: TransactionContextPath): string {
  const formattedDate = new Date(transactionContext.timeStamp).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  return `https://etherscan.io/advanced-filter?fadd=${transactionContext.from}&tadd=${transactionContext.to}&age=${formattedDate}%7e${formattedDate}&tkn=${transactionContext.tokenContractAddress}`;
}

// Recursive function to follow the transaction path

const followTransactionFlow = (
  transaction: TransactionContextPath, transactionContextPath: TransactionContextPath[], startAt: number | null
): { transactionContextPath: TransactionContextPath[], tokenSplitOrCombinationHash?: string } => {

  const matchingTransactions = transaction.nextTransactions.filter(t => {
    return t.tokenContractAddress === transaction.tokenContractAddress && t.tokenAmount === transaction.tokenAmount

  }).sort((a, b) => a.blockNumber - b.blockNumber)
  if (matchingTransactions.length) {
    const matchingTransaction = matchingTransactions[0]
    return followTransactionFlow(matchingTransaction, [{ ...matchingTransaction, nextTransactions: [] }, ...transactionContextPath], null)
  } else if (startAt !== null) {
    return followTransactionFlow(transaction.nextTransactions[startAt], [{ ...transaction.nextTransactions[startAt], nextTransactions: [] }, ...transactionContextPath], null)
  } else {
    return {
      transactionContextPath: transactionContextPath.reverse(), tokenSplitOrCombinationHash: getEtherscanLink(transaction)

    }
  }
}

// Main function to process the transaction
async function processTransaction(filePath: string): Promise<void> {
  const transactionData = readTransactionData(filePath);
  // The root's children represent initial fund splitting, so we handle it differently
  const paths = await Promise.all(transactionData.nextTransactions.map((_t, i) => {
    return followTransactionFlow(transactionData, [], i);
  }))
  console.log('Transaction Path:', JSON.stringify(paths, null, 2));
}

// Example usage
processTransaction('./output/test.json');
