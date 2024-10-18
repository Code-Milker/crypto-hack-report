import { ChainInfo } from '../types';
import { delay } from '../utils';
import {
  cacheCoinGeckoApiNames,
  cacheTokenPriceUSD,
  getcachedTokenPriceUSD,
  getCachedCoinGeckoApiNames,
  TokenPriceUSD,
  cacheCoinGeckoTokenDetails,
  getCachedCoinGeckoTokenDetails,
  cacheCoinGeckoTokenDetailsId,
  getCachedCoinGeckoTokenDetailsId,
} from '../dbCalls/coinGeckoData';

export async function fetchTokenCoinGeckoData(
  name: string,
  chainInfo: ChainInfo,
): Promise<TokenPriceUSD> {
  let tokenUsdData = await getcachedTokenPriceUSD(name, chainInfo.chainId);
  if (tokenUsdData !== null) {
    return tokenUsdData;
  }
  await delay(1000);
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${name}&vs_currencies=usd`;

  const response = await fetch(url);

  const data = await response.json();
  if (data[name] && data[name].usd) {
    const entry = { on: new Date(), ...data[name] };
    await cacheTokenPriceUSD(name, chainInfo.chainId, entry);
    return entry;
  }
  throw new Error(`Unable to fetch ${name.toUpperCase()} price`);
}
export const getTokenId = async (symbol: string) => {
  try {
    let tokens = await getCachedCoinGeckoApiNames()
    if (!tokens?.length) {
      await delay(2000)
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/list`);
      tokens = await response.json();
      await cacheCoinGeckoApiNames(tokens)
    }
    if (tokens === null) {
      return null;
    }

    const id = await getCachedCoinGeckoTokenDetailsId(symbol)
    if (id) {
      if (tokens) {
        const token = tokens.find(t => t.id === id)
        return token ?? null
      }
    }
    const tokensWithSameSymbol = tokens.filter((token: any) => token.symbol.toLowerCase() === symbol.toLowerCase())
    for (const t of tokensWithSameSymbol) {
      const details = (await getTokenDetails(t.id)) as { id: string }

      if (details) {
        await cacheCoinGeckoTokenDetailsId(symbol, t.id as string)
      }
    }
  } catch (error) {
    console.error('Error fetching token ID:', error);
    throw error;
  }
};

// Function to get the price of a token
// export const getTokenPrice = async (id: string) => {
//   try {
//     const response = await fetch(
//       `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
//     );
//     const data = await response.json();
//
//     if (data[id]) {
//       const price = data[id].usd;
//       return price;
//     } else {
//       throw new Error(`Price not found for token ID: ${tokenId}`);
//     }
//   } catch (error) {
//     console.error('Error fetching token price:', error);
//     throw error;
//   }
// };
const getTokenDetails = async (coinId: string) => {
  try {
    const tokenDetails = await getCachedCoinGeckoTokenDetails(coinId)
    console.log(tokenDetails)

    if (tokenDetails?.id) {
      return tokenDetails
    }
    await delay(2000)
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
    const data = await response.json();
    if (data?.id === coinId) {
      await cacheCoinGeckoTokenDetails(coinId, data)
      return data;
    }
    return null
  } catch (error) {
    console.error('Error fetching token details:', error);
  }
};
