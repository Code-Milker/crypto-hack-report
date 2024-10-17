import { ethers } from 'ethers';
import 'dotenv/config'; // Loads .env variables into process.env
import { TokenPriceUSD } from './dbCalls/coinGeckoData';
export const createProvider = (rpcUrl: string): ethers.JsonRpcProvider => {
  return new ethers.JsonRpcProvider(rpcUrl);
};

export const fetchENSName = async (address: string | null, provider: ethers.Provider) => {
  if (!address) return '';
  try {
    return (await provider.lookupAddress(address)) ?? '';
  } catch {
    return '';
  }
};

export function getBlockDaysAhead(startBlock: number, days: number) {
  const blocksPerDay = 6500; // Approximate blocks per day on Ethereum (13 seconds per block)
  const blocksInWeek = blocksPerDay * days; // About 45,500 blocks in a week
  // Calculate the block number one week ahead
  const endBlock = startBlock + blocksInWeek;
  return endBlock;
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function stringifyBigInt(obj: any) {
  return JSON.stringify(
    obj,
    (key, value) => (typeof value === 'bigint' ? value.toString() : value),
    2,
  );
}

// Function to compare native token transfers within $150 range
export async function isTokenTransferWithinRange(
  incomingValue: number, // Incoming transaction value in native tokens
  outgoingValue: number, // Outgoing transaction value in native tokens
  allowedRange: number, // dollar amount range it can fall within
  tokenData: TokenPriceUSD
): Promise<boolean> {

  const incomingUSD = incomingValue * tokenData.usd;
  const outgoingUSD = outgoingValue * tokenData.usd;
  console.log({ incomingUSD, outgoingUSD, allowedRange })
  return Math.abs(incomingUSD - outgoingUSD) <= allowedRange;
  return true;
}
