import * as fs from 'fs';

type Transaction = {
  transactionHash: string;
  to: string;
  from: string;
  timeStamp: string;
  blockNumber: number;
  ensName: string;
  tokenAmount: string;
  tokenContractAddress: string;
};

type ChildTransaction = {
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  transactionHash: string;
  children: ChildTransaction[];
};

type RootTransactionData = {
  rootTransaction: Transaction;
  transactions: ChildTransaction[];
};

// Function to read JSON file and parse it
function readTransactionData(filePath: string): RootTransactionData {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawData);
}

// Function to construct the Etherscan filter link
function getEtherscanLink(from: string, to: string, date: string, token: string): string {
  const formattedDate = new Date(date).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  return `https://etherscan.io/advanced-filter?fadd=${from}&tadd=${to}&age=${formattedDate}%7e${formattedDate}&tkn=${token}`;
}

// Recursive function to follow the transaction path
function followTransactionPath(
  transaction: Transaction,
  children: ChildTransaction[],
  isRoot: boolean = false,
): { rootTransaction: string; children: (string | string[])[] } {
  const transactionPath = {
    rootTransaction: transaction.transactionHash,
    children: [] as (string | string[])[],
  };

  for (const child of children) {
    const childTransactionGroup: string[] = [child.transactionHash];

    if (child.value === transaction.tokenAmount) {
      // Recursively go deeper into the transaction chain if the value matches
      if (child.children.length > 0) {
        const childPath = followTransactionPath(
          { ...transaction, tokenAmount: child.value },
          child.children,
        );
        childTransactionGroup.push(...childPath.children.flat());
      }
    } else {
      // If no matching value, push an Etherscan link for manual inspection
      const etherscanLink = getEtherscanLink(
        child.from,
        child.to,
        transaction.timeStamp,
        transaction.tokenContractAddress,
      );
      childTransactionGroup.push(etherscanLink);
    }

    transactionPath.children.push(childTransactionGroup);
  }

  return transactionPath;
}

// Main function to process the transaction
function processTransaction(filePath: string): void {
  const { rootTransaction, transactions } = readTransactionData(filePath);

  // The root's children represent initial fund splitting, so we handle it differently
  const transactionPath = followTransactionPath(rootTransaction, transactions, true);
  console.log('Transaction Path:', transactionPath);
}

// Example usage
processTransaction('../test.json');
