import { ChainInfo } from '../types';
import { delay } from '../utils';
import { cacheTokenPriceUSD, getcachedTokenPriceUSD, TokenPriceUSD } from '../dbCalls/coinGeckoData';
import { getTokenName } from './rpc';

export async function fetchTokenCoinGeckoData(name: string, chainInfo: ChainInfo): Promise<TokenPriceUSD> {
  let tokenUsdData = await getcachedTokenPriceUSD(name, chainInfo.chainId);
  if (tokenUsdData !== null) {
    return tokenUsdData;
  }
  await delay(1000);
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${name}&vs_currencies=usd`;

  const response = await fetch(url);

  const data = await response.json();
  if (data[name] && data[name].usd) {
    const entry = { on: new Date(), ...data[name] }
    await cacheTokenPriceUSD(name, chainInfo.chainId, entry)
    return entry;
  }
  throw new Error(`Unable to fetch ${name.toUpperCase()} price`);
}

