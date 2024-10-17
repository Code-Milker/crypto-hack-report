import jsonfile from 'jsonfile';
import { checkFileExists } from './dbUtils';
import { stringifyBigInt } from '../utils';
import { FetchTransactionInformation, } from '../data/transactions';
const cacheDb = 'db/cache/transaction.json';

/**
 * Cache ABI, decoded method, or decoded event based on transaction hash.
 * @param transactionHash - The hash of the transaction.
 * @param chainId - The chain ID.
 * @param value - The value to cache (ABI, decoded method, or decoded event).
 */
export async function cacheTransactionInformation(
  transactionHash: string,
  chainId: number,
  value: any,
) {
  const fileExists = await checkFileExists(cacheDb);
  let db: any = fileExists ? await jsonfile.readFile(cacheDb) : {};
  const cacheKey = `${transactionHash}_${chainId}`; // Composite key based on transaction hash and chainId
  db[cacheKey] = stringifyBigInt(value);
  await jsonfile.writeFile(cacheDb, db, { spaces: 2 });
}

/**
 * Retrieve cached ABI, decoded method, or decoded event based on transaction hash.
 * @param transactionHash - The hash of the transaction.
 * @param chainId - The chain ID.
 * @param key - The key to retrieve (ABI, method, or event).
 * @returns {Promise<any | null>}
 */
export async function getCachedTransactionInformation(
  transactionHash: string,
  chainId: number,
): Promise<FetchTransactionInformation | null> {
  const fileExists = await checkFileExists(cacheDb);

  if (!fileExists) {
    throw Error(cacheDb + ' does not exist');
  }

  const db = await jsonfile.readFile(cacheDb);
  const cacheKey = `${transactionHash}_${chainId}`; // Composite key based on transaction hash and chainId
  if (!db[cacheKey]) {
    return null;
  }

  return JSON.parse(db[cacheKey]) || null;
}
