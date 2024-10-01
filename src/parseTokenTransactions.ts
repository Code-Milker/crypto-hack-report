import * as fs from 'fs';
import { TransactionContext, TransactionContextPath } from './types';



// Function to read JSON file and parse it
function readTransactionData(filePath: string): any {
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
  transaction: TransactionContextPath,
  tokenAmount: string
): { transactionContextPath: TransactionContextPath[], tokenSplitOrCombinationHash?: string } => {
  const transactionContextPath: TransactionContextPath[] = [];

  // Start with the root transaction
  transactionContextPath.push(
    transaction,
  );
  // If this transaction has any children transactions, check those
  for (const childTransaction of transaction.nextTransactions) {
    // Check if the child's tokenAmount matches the current tokenAmount being transferred
    if (childTransaction.tokenAmount === tokenAmount) {
      // Add the child transaction to the flow
      transactionContextPath.push(childTransaction);

      // Recurse into the child transaction to find the next matching transaction
      const nextFlow = followTransactionFlow(childTransaction, transaction.tokenAmount);
      transactionContextPath.push(...nextFlow.transactionContextPath);
    } else {
      // If no matching tokenAmount is found, leave an Etherscan link for manual inspection
      getEtherscanLink(transaction)
      return { transactionContextPath, tokenSplitOrCombinationHash: childTransaction.transactionHash }
    }
  }

  return { transactionContextPath, tokenSplitOrCombinationHash: '' }
}

// Main function to process the transaction
function processTransaction(filePath: string): void {
  const { rootTransaction, nextTransactions } = readTransactionData(filePath);
  // The root's children represent initial fund splitting, so we handle it differently
  const transactionPath = followTransactionFlow(rootTransaction, nextTransactions,);
  console.log('Transaction Path:', transactionPath);
}

// Example usage
processTransaction('test.json');
