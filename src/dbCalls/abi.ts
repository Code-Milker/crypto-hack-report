import jsonfile from 'jsonfile';
import { checkFileExists } from './dbUtils';
const abiCacheDb = 'db/cache/abi.json';

/**
 * Cache the ABI for a contract on a specific chain.
 * @param contractAddress - The address of the contract.
 * @param chainId - The chain ID.
 * @param abi - The ABI to cache.
 */
export async function cacheAbi(contractAddress: string, chainId: number, abi: string) {
  const cacheKey = `${contractAddress}_${chainId}`; // Composite key including chainId
  const fileExists = await checkFileExists(abiCacheDb);
  let db: any = fileExists ? await jsonfile.readFile(abiCacheDb) : {};

  db[cacheKey] = JSON.parse(abi);

  await jsonfile.writeFile(abiCacheDb, db, { spaces: 2 });
  console.log(`ABI cached successfully for contract ${contractAddress} on chain ${chainId}`);
}

/**
 * Retrieve the cached ABI for a contract on a specific chain.
 * @param contractAddress - The address of the contract.
 * @param chainId - The chain ID.
 * @returns {Promise<string | null>}
 */
export async function getCachedAbi(
  contractAddress: string,
  chainId: number,
): Promise<string | null> {
  const cacheKey = `${contractAddress}_${chainId}`; // Composite key including chainId
  const fileExists = await checkFileExists(abiCacheDb);
  if (!fileExists) {
    return null;
  }
  const db = await jsonfile.readFile(abiCacheDb);
  if (db[cacheKey]) {
    return JSON.stringify(db[cacheKey]);
  }
  return null;
}
