import jsonfile from 'jsonfile';
import { checkFileExists } from './dbUtils';
const dbFileName = 'db/cache/tokenPriceUSD.json';
export interface TokenPriceUSD { on: Date; usd: number }
export async function cacheTokenPriceUSD(
  tokenName: string,
  chainId: number,
  tokenData: Omit<TokenPriceUSD, 'on'>,
) {
  const cacheKey = `${tokenName}_${chainId}`; // Composite key including chainId
  const fileExists = await checkFileExists(dbFileName);
  let db: any = fileExists ? await jsonfile.readFile(dbFileName) : {};
  db[cacheKey] = tokenData;
  await jsonfile.writeFile(dbFileName, db, { spaces: 2 });
  console.log(`token data cached successfully for contract ${tokenName} on chain ${chainId}`);
}

export async function getcachedTokenPriceUSD(
  tokenAddress: string,
  chainId: number,
): Promise<TokenPriceUSD | null> {
  const cacheKey = `${tokenAddress}_${chainId}`; // Composite key including chainId
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
