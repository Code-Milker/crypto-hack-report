import { promises as fs } from 'fs';
import jsonfile from 'jsonfile';

export const stepFileDb = 'db/attack-information.json';
export const cacheTokenTransactions = 'db/token-transactions.json';
export const getDb = async () => {
  const fileExist = await checkFileExists(stepFileDb);
  const db = fileExist ? await jsonfile.readFile(stepFileDb) : {};
  return db;
};
async function checkFileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true; // File exists
  } catch {
    return false; // File does not exist
  }
}

export const fetchStepData = async (step: number) => {
  const fileExists = checkFileExists(stepFileDb);
  if (!fileExists) {
    throw Error('file does not exist');
  }
  const db = await jsonfile.readFile(stepFileDb);
  if (!db[step]) {
    throw Error(`step ${step} does not exist`);
  }
  return db[step];
};

export const writeStepData0 = async (step: number, data: any) => {
  const db = await getDb();
  if (Object.keys(db).length === 0 && step !== 0) {
    throw Error('DB is empty, generate from 0');
  }

  const updatedDb = {
    ...db, [step]: data
  }
  await jsonfile.writeFile(stepFileDb, updatedDb, { spaces: 2 });
  console.log(`successfully wrote data for step ${step}`);
};
export const writeStepDataWithTransactionHashIndex = async (step: number, data: any, idName: string) => {
  const db = await getDb();
  if (Object.keys(db).length === 0 && step !== 0) {
    throw Error('DB is empty, generate from 0');
  }

  const updatedDb = {
    ...db, [step]: { ...db[step], lastSuccessfulHash: idName, [idName]: data }
  }
  console.log(idName)
  await jsonfile.writeFile(stepFileDb, updatedDb, { spaces: 2 });
  console.log(`successfully wrote data for step ${step}`);
};

export const tokenTransferEventCacheDb = 'db/tokenEventsCache.json';
export async function cacheEvents(
  tokenContractAddress: string,
  startBlock: number,
  endBlock: number,
  events: any[],
) {
  const fileExists = await checkFileExists(tokenTransferEventCacheDb);
  let db: any = {};
  if (!fileExists) {
    db = { eventCache: {} }
  } else {
    db = await jsonfile.readFile(tokenTransferEventCacheDb);
  }

  // Create a string key based on the combination of tokenContractAddress, startBlock, and endBlock
  const cacheKey = `${tokenContractAddress}_${startBlock}_${endBlock}`;

  // Check if the entry already exists (to prevent duplicates)
  if (!db.eventCache[cacheKey]) {
    // Add new cache entry
    db.eventCache[cacheKey] = {
      tokenContractAddress,
      startBlock,
      endBlock,
      events,
    };
    await jsonfile.writeFile(tokenTransferEventCacheDb, db, { spaces: 2 });
    console.log('Events cached successfully.');
  } else {
    console.log('Entry already exists in the cache.');
  }
}
export async function getCachedEvents(
  tokenContractAddress: string,
  startBlock: number,
  endBlock: number,
): Promise<any[] | null> {
  const fileExists = await checkFileExists(tokenTransferEventCacheDb);

  if (!fileExists) {
    return null; // No cache file exists
  }

  const db = await jsonfile.readFile(tokenTransferEventCacheDb);

  // Create a string key based on the combination of tokenContractAddress, startBlock, and endBlock
  const cacheKey = `${tokenContractAddress}_${startBlock}_${endBlock}`;

  // Retrieve cached data
  const cachedEntry = db.eventCache ? db.eventCache[cacheKey] : null;

  if (cachedEntry) {
    return cachedEntry.events; // Return cached events
  } else {
    return null; // No cached data found for this block range
  }
}
