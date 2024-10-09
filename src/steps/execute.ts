import { ethers, toBigInt } from 'ethers';
import { chainInfoMap } from '../info';
import { ChainId, ChainInfo } from '../types';
import { generateAttackReport, step1 } from './1_fetchTokenTransaction';
// step0()
// step1('')
//
const run = async () => {
  const chain: ChainInfo = chainInfoMap.get(ChainId.Fantom) as ChainInfo;
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl)
  // ftm native 
  // const report = await generateAttackReport(
  //   '0xcee4da0e7bdbb3112b2cd249b459d92c1afc23047db545c33ee60532773736d9',
  //   new ethers.JsonRpcProvider(chain.rpcUrl),
  //   chain,
  // );
  //
  //equal token
  // const report = await generateAttackReport(
  //   '0xd48776312e5b60fb9318c439d406b5ea32292aa3fa2cf850f89e0ba05b884eca',
  //   provider,
  //   chain,
  // );
  //
  // const report1 = await generateAttackReport(
  //   '0xbf7d6a7c62dbbe381c6a11c8ead23c0d7c3d3b2e22e8320559e69f08ada05604',
  //   provider,
  //   chain,
  // );

  // console.log(JSON.stringify({ equal: report }, null, 2))
  // console.log(JSON.stringify({ equal: report1 }, null, 2))
  const res = await fetchTransactionLogs('0xc801e29d9cbc29865a67a134a87cd37e82059be7389e5bcbc29c25ac1f1eab16', provider)
  console.log(res)
  // await deleteDb(0)
  // // await deleteDb(2)
  // await deleteDb(3)
  // await step0()
  // // await step1()
  // await step2();
  // await step3()
  // const res = await fetchBlockInfoFromTransaction('0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f', provider)
};
run();
// fetchTransactionDetails('0x35d924386dbee66d31d7f4faa75572965d39b834a4468cb7f797b749828976d5', provider).then(console.log)
//

// Define the ABI for the token swap event (this could be a standard transfer or a custom swap event)

// ABI for the SwappedV3 event

// ABI for the SwappedV3 event

// ERC-20 Transfer ABI
const TRANSFER_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Function to fetch and decode events from a transaction
async function fetchTransactionLogs(transactionHash: string, provider: ethers.Provider) {
  // Fetch the transaction receipt from the blockchain
  const receipt = await provider.getTransactionReceipt(transactionHash);
  if (!receipt) {
    throw new Error(`Transaction receipt not found for ${transactionHash}`);
  }

  // Interface to decode logs using Transfer ABI

  // Loop through the logs to decode and extract details
  const decodedTransferLogs = []
  for (const log of receipt.logs) {
    try {
      // Decode Transfer events
      const isTransferLog = await verifyTransferEvent(log)
      if (isTransferLog === null) {
        continue;
      }
      const decodedLog = await decodeLog(log)
      decodedTransferLogs.push(decodedLog)

      // console.log(`Transfer detected: from ${from} to ${to} for ${value} tokens`);
    } catch (error) {
      // If it isn't a Transfer event, skip and continue
      continue;
    }

    console.log(decodedTransferLogs)
  }
}

// Example usage
const provider = new ethers.JsonRpcProvider('https://rpc.ftm.tools/');
const transactionHash = '0xc801e29d9cbc29865a67a134a87cd37e82059be7389e5bcbc29c25ac1f1eab16'; // Your transaction hash

fetchTransactionLogs(transactionHash, provider).catch(console.error);
async function decodeLog(log: any) {
  // Log details
  const contractAddress = log.address;
  const blockNumber = log.blockNumber;
  const transactionHash = log.transactionHash;
  const fromAddress = `0x${log?.topics[1]?.slice(26)}`; // Slice off the padding
  const toAddress = `0x${log?.topics[2]?.slice(26)}`;   // Slice off the padding
  const amount = ethers.formatUnits(toBigInt(log.data), 18);
  const index = log.index;
  // console.log(log)
  // Log details
  return { transactionHash, blockNumber, contractAddress, fromAddress, toAddress, amount, index }
}
interface TransferEventDetails {
  from: string;
  to: string;
  value: string;
}
async function verifyTransferEvent(log: ethers.Log): Promise<boolean> {
  // Create an interface to decode the Transfer event
  const transferIface = new ethers.Interface(TRANSFER_ABI);

  try {
    // Try to decode the log using the Transfer event
    const decodedLog = transferIface.decodeEventLog("Transfer", log.data, log.topics);
    return true

  } catch (error) {
    console.warn("Log is not a valid ERC-20 Transfer event.");
    return false;  // If decoding fails, return null
  }
}
