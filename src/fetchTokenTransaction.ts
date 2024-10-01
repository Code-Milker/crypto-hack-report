import { ethers } from "ethers";
// 0xaa178b10a3a37bab88fe5947950c314ebab98af1c5e4ef79a8f850bdf5a5a176
// 0x3bf43a4089ef9b18263efe934b710b65c6d4d80f5635404e0c1485017c14ae39
//0x62daaf829021c507075369bd4464d0dcacdbe92e95ab32ef5155d83ee9f388a0
// Define the ERC20 ABI with the decimals function
const erc20ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

const fetchBlockInfoFromTransaction = async (txHash: string): Promise<ethers.Block> => {
  // Step 1: Fetch transaction receipt
  const txReceipt = await provider.getTransactionReceipt(txHash);

  if (!txReceipt) {
    throw Error("Transaction not found");
  }

  // Step 2: Get the block number from the transaction receipt
  const blockNumber = txReceipt.blockNumber;

  // Step 3: Fetch block information using the block number
  const blockInfo = await provider.getBlock(blockNumber);
  if (!blockInfo || !blockInfo?.number) { throw Error('block number not found') }

  return blockInfo;

  // Log the block information
};

// Fetch only outgoing token transactions for a specific account
const fetchOutgoingTokenTransactions = async (
  provider: ethers.JsonRpcProvider,
  tokenContractAddress: string,
  account: string,
  fromTransactionHash: string, // Optional starting transaction hash to filter from
  transactionLimit: number
) => {
  const block = await fetchBlockInfoFromTransaction(fromTransactionHash)
  const tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider);
  const decimals = await tokenContract.decimals();
  const transferFilterOutgoing = tokenContract.filters.Transfer(account, null); // Only outgoing transfers


  // Fetch all outgoing events for the account
  const eventsOutgoing = await tokenContract.queryFilter(transferFilterOutgoing, block.number);
  const transactionDetails: any[] = [];

  eventsOutgoing.forEach((event) => {
    const transactionHash = event.transactionHash;

    // if (transactionHash <= fromTransactionHash) {
    //   return;
    // }

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
  return transactionDetails.slice(0, transactionLimit);
};

// Recursive function to fetch outgoing token transactions for 'to' addresses
const recursiveFetchTransactions = async (
  provider: ethers.JsonRpcProvider,
  tokenContractAddress: string,
  startAddress: string,
  depth: number,
  fromTransactionHash: string,
  transactionLimit: number
) => {
  if (depth === 0) return [];

  // Fetch outgoing transactions for the startAddress
  const transactions = await fetchOutgoingTokenTransactions(provider, tokenContractAddress, startAddress, fromTransactionHash, transactionLimit);

  // For each transaction, recursively fetch children transactions
  for (const transaction of transactions) {
    // Recursively fetch outgoing transactions from the `to` address and store them in the `children` property
    const childTransactions = await recursiveFetchTransactions(
      provider,
      tokenContractAddress,
      transaction.to,
      depth - 1,
      transaction.transactionHash, transactionLimit // Pass the current transaction's hash as the starting point for the next recursion
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
  const depth = 1; // Recursion depth

  recursiveFetchTransactions(
    provider,
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // Token contract address (e.g., WBTC)
    '0xD590923D687C921B8eD6566D9c357882E7F22eA9', // Starting address
    depth,
    '0x83db357ac4c7a1167052fcfbd59b9c116042b2dc5e005f1f1115b8c936531d52',
    30
  )
    .then((transactions) => console.log("Recursive transactions fetched: ", JSON.stringify(transactions, null, 2)))
    .catch(console.error);
})();
[
  {
    "blockNumber": 20493326,
    "from": "0xD590923D687C921B8eD6566D9c357882E7F22eA9",
    "to": "0x2fe9E7291EeE09834244280456110D7E022e188a",
    "value": "0.2",
    "transactionHash": "0xaa178b10a3a37bab88fe5947950c314ebab98af1c5e4ef79a8f850bdf5a5a176",
    "children": []
  },
  {
    "blockNumber": 20493359,
    "from": "0xD590923D687C921B8eD6566D9c357882E7F22eA9",
    "to": "0xCF4d11669a545cA1c6A2896C26dbcA0cE8E8327a",
    "value": "0.2",
    "transactionHash": "0xda19339d01d5e246a890e5349903ff5e4ef6feac598c6bcffdb75bd015ef65e9",
    "children": []
  },
  {
    "blockNumber": 20493469,
    "from": "0xD590923D687C921B8eD6566D9c357882E7F22eA9",
    "to": "0x570C7E8E55edDfdaB7C3D458FDd3399E4530b862",
    "value": "0.2",
    "transactionHash": "0xd59ea0d46ec944f9a3123b75a981773fc433a72f2afc259d1099c82754972368",
    "children": []
  },
  {
    "blockNumber": 20493505,
    "from": "0xD590923D687C921B8eD6566D9c357882E7F22eA9",
    "to": "0x8E4259ACCc558211955049Ddb62020c113D825ED",
    "value": "0.2",
    "transactionHash": "0xc5c8c707b1fd57494b56b738a95819690dd42fe798df9e8fc80494b4c428681c",
    "children": []
  },
  {
    "blockNumber": 20493510,
    "from": "0xD590923D687C921B8eD6566D9c357882E7F22eA9",
    "to": "0xe45deE288D3D83cDed2fAe7cf9251cE199a286D0",
    "value": "0.2",
    "transactionHash": "0x90cf8c352c1517c5aaa3abf799b492e81a4adb5bb28d54cac2f3f57575336be7",
    "children": []
  },
  {
    "blockNumber": 20493552,
    "from": "0xD590923D687C921B8eD6566D9c357882E7F22eA9",
    "to": "0xdF0922464CF5953F7314442A60D536ea10168F9F",
    "value": "0.2",
    "transactionHash": "0xf4130b8deb7d7f97162547dd96f2e2b0c906fd53c5c97c5abdac307caa95ad9e",
    "children": []
  },
  {
    "blockNumber": 20493661,
    "from": "0xD590923D687C921B8eD6566D9c357882E7F22eA9",
    "to": "0x33B7BCCc7D1882cE9D59798a5364815CD1cDB96F",
    "value": "0.3",
    "transactionHash": "0xc5bd354ece9df23beae4fa81f090907b2fa0f8f9e325dfc4af98383ba82da17e",
    "children": []
  },
  {
    "blockNumber": 20493697,
    "from": "0xD590923D687C921B8eD6566D9c357882E7F22eA9",
    "to": "0xf07E451258aE95067785FAD53EE179B1655Ff235",
    "value": "0.3",
    "transactionHash": "0x963edbfe919d68edf7008b6a3a4aa16a9dbdaf241619c9834335aef255da416b",
    "children": []
  },
  {
    "blockNumber": 20493825,
    "from": "0xD590923D687C921B8eD6566D9c357882E7F22eA9",
    "to": "0x57bb8aFC41e0DE4b2c14121082A571498222d28a",
    "value": "3.50034369",
    "transactionHash": "0xd40920d55f8b60ff69d548f6e2e7622b037450f8ea4d2b5195f91079dea31a73",
    "children": []
  }
]
