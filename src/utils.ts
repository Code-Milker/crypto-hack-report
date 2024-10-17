import { ethers } from 'ethers';
import 'dotenv/config'; // Loads .env variables into process.env
import { TokenPriceUSD } from './dbCalls/coinGeckoData';
import { getBlocksPerDay } from './api/rpc';
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
  return Math.abs(incomingUSD - outgoingUSD) <= allowedRange;
}
