import { BigNumberish } from 'ethers';
import { chainInfoMap } from '../info';
import { ChainInfo } from '../types';
import { delay } from '../utils';

async function fetchNativeTokenPrice(chainInfo: ChainInfo): Promise<number> {
  await delay(1000);
  const name = chainInfo.nativeCurrency.name.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${name}&vs_currencies=usd`;

  const response = await fetch(url);

  const data = await response.json();
  if (data[name] && data[name].usd) {
    return data[name].usd;
  }
  console.log(data);

  throw new Error(`Unable to fetch ${name.toUpperCase()} price`);
}

// Function to compare native token transfers within $150 range
export async function isNativeTokenTransferWithinRange(
  incomingValue: number, // Incoming transaction value in native tokens
  outgoingValue: number, // Outgoing transaction value in native tokens
  allowedRange: number,
  chainInfo: ChainInfo, // Chain information (from chainInfoMap)
): Promise<boolean> {
  // const nativeTokenPrice = await fetchNativeTokenPrice(chainInfo);
  const nativeTokenPrice = 0.6; //temp
  // Convert token values to USD
  const incomingUSD = incomingValue * nativeTokenPrice;
  const outgoingUSD = outgoingValue * nativeTokenPrice;
  console.log({ incomingValue, incomingUSD });
  console.log({ outgoingValue, outgoingUSD });
  return Math.abs(incomingUSD - outgoingUSD) <= allowedRange;
}
