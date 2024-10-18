import jsonfile from 'jsonfile';
import { checkFileExists } from './dbUtils';
import { delay, stringifyBigInt } from '../utils';
import { TransactionContext } from '../types';
const dbFileName = 'db/cache/transaction.json';

/**
 * Cache ABI, decoded method, or decoded event based on transaction hash.
 * @param transactionHash - The hash of the transaction.
 * @param chainId - The chain ID.
 * @param value - The value to cache (ABI, decoded method, or decoded event).
 */
export async function cacheTransactionInformation(
  transactionHash: string,
  chainId: number,
  value: TransactionContext,
) {
  const fileExists = await checkFileExists(dbFileName);
  let db: any = fileExists ? await jsonfile.readFile(dbFileName) : {};
  const cacheKey = `${transactionHash}_${chainId}`; // Composite key based on transaction hash and chainId
  db[cacheKey] = JSON.parse(stringifyBigInt(value));
  await jsonfile.writeFile(dbFileName, db, { spaces: 2 });
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
): Promise<TransactionContext | null> {
  const fileExists = await checkFileExists(dbFileName);

  if (!fileExists) {
    throw Error(dbFileName + ' does not exist');
  }
  const db = (await jsonfile.readFile(dbFileName)) ?? {};
  const cacheKey = `${transactionHash}_${chainId}`; // Composite key based on transaction hash and chainId
  if (!db[cacheKey]) {
    return null;
  }
  return db[cacheKey] || null;
}
