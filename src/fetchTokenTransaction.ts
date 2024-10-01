import { ethers } from "ethers";

// Define the ERC20 ABI with the decimals function
const erc20ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

// Fetch only outgoing token transactions for a specific account
const fetchOutgoingTokenTransactions = async (
  provider: ethers.JsonRpcProvider,
  tokenContractAddress: string,
  account: string,
  fromTransactionHash?: string // Optional starting transaction hash to filter from
) => {
  const tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider);
  const decimals = await tokenContract.decimals();
  const transferFilterOutgoing = tokenContract.filters.Transfer(account, null); // Only outgoing transfers

  // Fetch all outgoing events for the account
  const eventsOutgoing = await tokenContract.queryFilter(transferFilterOutgoing);
  const transactionDetails: any[] = [];

  eventsOutgoing.forEach((event) => {
    const transactionHash = event.transactionHash;

    // If we have a `fromTransactionHash`, skip transactions prior to or at that hash
    if (fromTransactionHash && transactionHash <= fromTransactionHash) {
      return;
    }

    // @ts-ignore
    const from = event.args?.from;
    // @ts-ignore
    const to = event.args?.to;
    // @ts-ignore
    const value = event.args?.value;

    if (from && to && value) {
      const formattedValue = ethers.formatUnits(value, decimals);
      const transaction = {
        blockNumber: event.blockNumber,
        from: from,
        to: to,
        value: formattedValue,
        transactionHash: transactionHash,
        children: [] // Initialize the children property as an empty array
      };

      transactionDetails.push(transaction);
    }
  });

  // Limit the result to a maximum of 50 transactions
  return transactionDetails.slice(0, 5);
};

// Recursive function to fetch outgoing token transactions for 'to' addresses
const recursiveFetchTransactions = async (
  provider: ethers.JsonRpcProvider,
  tokenContractAddress: string,
  startAddress: string,
  depth: number,
  fromTransactionHash?: string
) => {
  if (depth === 0) return [];

  // Fetch outgoing transactions for the startAddress
  const transactions = await fetchOutgoingTokenTransactions(provider, tokenContractAddress, startAddress, fromTransactionHash);

  // For each transaction, recursively fetch children transactions
  for (const transaction of transactions) {
    // Recursively fetch outgoing transactions from the `to` address and store them in the `children` property
    const childTransactions = await recursiveFetchTransactions(
      provider,
      tokenContractAddress,
      transaction.to,
      depth - 1,
      transaction.transactionHash // Pass the current transaction's hash as the starting point for the next recursion
    );

    // Assign the child transactions to the `children` attribute
    transaction.children = childTransactions;
  }

  return transactions;
};

// Initialize the provider using ethers.providers
const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/5e6e5a11eb5f492792fb05057a80a602");

// Start the recursion process
(async () => {
  const depth = 3; // Recursion depth

  recursiveFetchTransactions(
    provider,
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // Token contract address (e.g., WBTC)
    '0xD590923D687C921B8eD6566D9c357882E7F22eA9', // Starting address
    depth
  )
    .then((transactions) => console.log("Recursive transactions fetched: ", JSON.stringify(transactions, null, 2)))
    .catch(console.error);
})();
