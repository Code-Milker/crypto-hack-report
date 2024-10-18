import jsonfile from 'jsonfile';
import { checkFileExists } from './dbUtils';
const dbFileName = 'db/cache/tokenPriceUSD.json';
export interface TokenPriceUSD {
  on: Date;
  usd: number;
}
export async function cacheTokenPriceUSD(
  tokenName: string,
  chainId: number,
  tokenData: Omit<TokenPriceUSD, 'on'>,
) {
  const cacheKey = `${tokenName.toLowerCase()}_${chainId}`; // Composite key including chainId
  const fileExists = await checkFileExists(dbFileName);
  let db: any = fileExists ? await jsonfile.readFile(dbFileName) : {};
  db[cacheKey] = tokenData;
  await jsonfile.writeFile(dbFileName, db, { spaces: 2 });
}

export async function getcachedTokenPriceUSD(
  tokenAddress: string,
  chainId: number,
): Promise<TokenPriceUSD | null> {
  const cacheKey = `${tokenAddress.toLowerCase()}_${chainId}`; // Composite key including chainId
  const fileExists = await checkFileExists(dbFileName);
  if (!fileExists) {
    return null;
  }
  const db = await jsonfile.readFile(dbFileName);
  if (db[cacheKey]) {
    return db[cacheKey];
  }
  return null;
}

const coinGeckoApiFileName = 'db/cache/coinGeckoApiFileName.json';
export async function getCachedCoinGeckoApiNames(
): Promise<{
  id: string,
  symbol: string,
  name: string
}[] | null> {
  const fileExists = await checkFileExists(coinGeckoApiFileName);
  if (!fileExists) {
    return null;
  }
  const db = await jsonfile.readFile(coinGeckoApiFileName);
  return db ? db : null


}
export async function cacheCoinGeckoApiNames(
  data: any,
) {
  const fileExists = await checkFileExists(coinGeckoApiFileName);
  if (!fileExists) {
    throw Error('file does not exist' + coinGeckoApiFileName)
  }
  // let db: any = fileExists ? await jsonfile.readFile(coinGeckoApiFileName) : [];
  await jsonfile.writeFile(coinGeckoApiFileName, data, { spaces: 2 });
}

const coinGeckoTokenDetails = 'db/cache/coinGeckoTokenDetails.json';
export async function getCachedCoinGeckoTokenDetails(id: string
): Promise<any | null> {
  const fileExists = await checkFileExists(coinGeckoTokenDetails);
  if (!fileExists) {
    return null;
  }
  const db = await jsonfile.readFile(coinGeckoTokenDetails);

  if (db[id]) {
    return db[id];
  }
  return null

}
export async function cacheCoinGeckoTokenDetails(
  id: string,
  data: any,
) {
  const fileExists = await checkFileExists(coinGeckoTokenDetails);
  if (!fileExists) {
    throw Error('file does not exist' + coinGeckoTokenDetails)
  }
  let db: any = fileExists ? await jsonfile.readFile(coinGeckoTokenDetails) : {};
  db[id] = data
  await jsonfile.writeFile(coinGeckoTokenDetails, db, { spaces: 2 });
}

const coinGeckoTokenDetailsId = 'db/cache/coinGeckoTokenDetailsId.json';
export async function getCachedCoinGeckoTokenDetailsId(id: string
): Promise<string | null> {
  const fileExists = await checkFileExists(coinGeckoTokenDetailsId);
  if (!fileExists) {
    return null;
  }
  const db = await jsonfile.readFile(coinGeckoTokenDetailsId);

  if (db[id]) {
    return db[id];
  }
  return null

}
export async function cacheCoinGeckoTokenDetailsId(
  id: string,
  data: string,
) {
  const fileExists = await checkFileExists(coinGeckoTokenDetailsId);
  if (!fileExists) {
    throw Error('file does not exist' + coinGeckoTokenDetailsId)
  }

  console.log({ fileExists, id, data })
  let db: any = fileExists ? await jsonfile.readFile(coinGeckoTokenDetailsId) : {};
  db[id] = data

  await jsonfile.writeFile(coinGeckoTokenDetailsId, db, { spaces: 2 });
}
