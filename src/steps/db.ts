import { promises as fs } from 'fs';
import jsonfile from 'jsonfile';

export const getStepFileDb = (step: number) => `db/${step}.json`;
export const tokenTransferEventCacheDb = 'db/tokenEventsCache.json';

/**
 * Utility function to check if a file exists
 * @param file - File path
 * @returns {Promise<boolean>}
 */
async function checkFileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the database object, ensuring the file exists.
 * @returns {Promise<any>}
 */
export const dbInit = async (step: number) => {
  const stepFileDb: string = getStepFileDb(step);
  const fileExists = await checkFileExists(stepFileDb);

  if (!fileExists) {
    await fs.mkdir('db', { recursive: true });
    await fs.writeFile(stepFileDb, JSON.stringify({}), 'utf-8');
  }

  return jsonfile.readFile(stepFileDb);
};

/**
 * Fetch data for a specific step from the database.
 * @param step - Step number
 * @returns {Promise<any>}
 */
export const fetchStepData = async (step: number) => {
  const stepFileDb = getStepFileDb(step);
  console.log(stepFileDb)
  const fileExists = await checkFileExists(stepFileDb);

  if (!fileExists) {
    throw new Error('File does not exist');
  }

  const db = await jsonfile.readFile(stepFileDb);

  if (!db.data) {
    throw new Error(`Step ${step} does not exist`);
  }

  return db.data;
};

/**
 * Delete the database file.
 */
export const deleteDb = async (step: number) => {
  const stepFileDb = getStepFileDb(step);
  const fileExists = await checkFileExists(stepFileDb);

  if (fileExists) {
    jsonfile.writeFile(stepFileDb, { data: {}, status: {} }, { spaces: 2 })
    // await fs.unlink(stepFileDb);
    console.log(`File ${stepFileDb} deleted successfully.`);
  } else {
    console.log(`File ${stepFileDb} does not exist.`);
  }
};

/**
 * Write data for a specific step in the database.
 * @param step - Step number
 * @param data - Data to write
 */
export const writeStepData = async (step: number, data: any) => {
  const db = await dbInit(step);
  const stepFileDb = getStepFileDb(step);

  if (Object.keys(db).length === 0 && step !== 0) {
    throw new Error('DB is empty, generate from step 0');
  }

  const updatedDb = { ...db, data: data, status: 'successfully wrote for step: ' + step };

  await jsonfile.writeFile(stepFileDb, updatedDb, { spaces: 2 });
  console.log(`Successfully wrote data for step ${step}`);
};

/**
 * Get the status of a specific step.
 * @param step - Step number
 * @returns {Promise<any>}
 */
export const getStepStatus = async (step: number) => {
  const db = await dbInit(step);

  if (!db.status) {
    throw new Error('No status object');
  }

  if (!db.status[step]) {
    throw new Error('No step object');
  }

  return db.status[step];
};

/**
 * Write step data with transaction hash index.
 * @param step - Step number
 * @param data - Data to write
 * @param idName - Transaction ID name
 */
export const writeStepDataWithTransactionHashIndex = async (
  step: number,
  data: any,
  idName: string,
) => {
  const stepFileDb = getStepFileDb(step);
  const db = await dbInit(step);

  if (Object.keys(db).length === 0 && step !== 0) {
    throw new Error('DB is empty, generate from step 0');
  }

  const updatedDb = {
    ...db,
    data: { ...db.data, [idName]: data },
    status: { ...db.status, lastWrittenTransaction: idName }
  }
  console.log(updatedDb);
  await jsonfile.writeFile(stepFileDb, updatedDb, { spaces: 2 });
  console.log(`Successfully wrote data for step ${step}`);
};

/**
 * Cache token transfer events.
 * @param tokenContractAddress - Contract address of the token
 * @param startBlock - Start block number
 * @param endBlock - End block number
 * @param events - Array of events to cache
 */
export async function cacheEvents(
  tokenContractAddress: string,
  startBlock: number,
  endBlock: number,
  events: any[],
) {
  const fileExists = await checkFileExists(tokenTransferEventCacheDb);
  let db: any = fileExists
    ? await jsonfile.readFile(tokenTransferEventCacheDb)
    : { eventCache: {} };

  const cacheKey = `${tokenContractAddress}_${startBlock}_${endBlock}`;

  if (!db.eventCache[cacheKey]) {
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

/**
 * Retrieve cached token transfer events.
 * @param tokenContractAddress - Contract address of the token
 * @param startBlock - Start block number
 * @param endBlock - End block number
 * @returns {Promise<any[] | null>}
 */
export async function getCachedEvents(
  tokenContractAddress: string,
  startBlock: number,
  endBlock: number,
): Promise<any[] | null> {
  const fileExists = await checkFileExists(tokenTransferEventCacheDb);

  if (!fileExists) {
    return null;
  }

  const db = await jsonfile.readFile(tokenTransferEventCacheDb);
  const cacheKey = `${tokenContractAddress}_${startBlock}_${endBlock}`;

  return db.eventCache ? db.eventCache[cacheKey]?.events : null;
}

// import { promises as fs } from 'fs';
// import jsonfile from 'jsonfile';
//
// export const stepFileDb = 'db/attack-information.json';
// export const getDb = async () => {
//   const fileExist = await checkFileExists(stepFileDb);
//   console.log(fileExist)
//   if (!fileExist) {
//     // Create the file with an empty object as the content
//     await fs.mkdir('db', { recursive: true }); // Ensure the directory exists
//     await fs.writeFile(stepFileDb, JSON.stringify({}), 'utf-8');
//   }
//
//   const db = await jsonfile.readFile(stepFileDb);
//   return db;
// };
// async function checkFileExists(file: string): Promise<boolean> {
//   try {
//     await fs.access(file);
//     return true; // File exists
//   } catch {
//     return false; // File does not exist
//   }
// }
//
// export const fetchStepData = async (step: number) => {
//   const fileExists = checkFileExists(stepFileDb);
//   if (!fileExists) {
//     throw Error('file does not exist');
//   }
//   const db = await jsonfile.readFile(stepFileDb);
//   if (!db[step]) {
//     throw Error(`step ${step} does not exist`);
//   }
//   return db[step];
// };
// export const deleteDb = async () => {
//   const fileExist = await checkFileExists(stepFileDb);
//
//   if (fileExist) {
//     await fs.unlink(stepFileDb); // Delete the file
//     console.log(`File ${stepFileDb} deleted successfully.`);
//   } else {
//     console.log(`File ${stepFileDb} does not exist.`);
//   }
// };
//
// export const writeStepData0 = async (step: number, data: any) => {
//   console.log(step)
//   const db = await getDb();
//   if (Object.keys(db).length === 0 && step !== 0) {
//     throw Error('DB is empty, generate from 0');
//   }
//
//   const updatedDb = {
//     ...db, [step]: data
//   }
//   console.log(updatedDb)
//   await jsonfile.writeFile(stepFileDb, updatedDb, { spaces: 2 });
//   console.log(`successfully wrote data for step ${step}`);
// };
// export const getStepStatus = async (step: number) => {
//
//   const db = await getDb();
//   if (!db.status) {
//     throw Error("no status object")
//   }
//
//   if (!db.status[step]) {
//     throw Error("no step object")
//   }
//   return db.status[step]
// }
// export const writeStepDataWithTransactionHashIndex = async (step: number, data: any, idName: string) => {
//   const db = await getDb();
//   if (Object.keys(db).length === 0 && step !== 0) {
//     throw Error('DB is empty, generate from 0');
//   }
//   const updatedDb = {
//     ...db, [step]: { ...db[step], [idName]: data, }, 'status': { ...db.status, [step]: { lastWrittenTransaction: idName } }
//   }
//   console.log(idName)
//   await jsonfile.writeFile(stepFileDb, updatedDb, { spaces: 2 });
//   console.log(`successfully wrote data for step ${step}`);
// };
//
// export const tokenTransferEventCacheDb = 'db/tokenEventsCache.json';
// export async function cacheEvents(
//   tokenContractAddress: string,
//   startBlock: number,
//   endBlock: number,
//   events: any[],
// ) {
//   const fileExists = await checkFileExists(tokenTransferEventCacheDb);
//   let db: any = {};
//   if (!fileExists) {
//     db = { eventCache: {} }
//   } else {
//     db = await jsonfile.readFile(tokenTransferEventCacheDb);
//   }
//
//   // Create a string key based on the combination of tokenContractAddress, startBlock, and endBlock
//   const cacheKey = `${tokenContractAddress}_${startBlock}_${endBlock}`;
//
//   // Check if the entry already exists (to prevent duplicates)
//   if (!db.eventCache[cacheKey]) {
//     // Add new cache entry
//     db.eventCache[cacheKey] = {
//       tokenContractAddress,
//       startBlock,
//       endBlock,
//       events,
//     };
//     await jsonfile.writeFile(tokenTransferEventCacheDb, db, { spaces: 2 });
//     console.log('Events cached successfully.');
//   } else {
//     console.log('Entry already exists in the cache.');
//   }
// }
// export async function getCachedEvents(
//   tokenContractAddress: string,
//   startBlock: number,
//   endBlock: number,
// ): Promise<any[] | null> {
//   const fileExists = await checkFileExists(tokenTransferEventCacheDb);
//
//   if (!fileExists) {
//     return null; // No cache file exists
//   }
//
//   const db = await jsonfile.readFile(tokenTransferEventCacheDb);
//
//   // Create a string key based on the combination of tokenContractAddress, startBlock, and endBlock
//   const cacheKey = `${tokenContractAddress}_${startBlock}_${endBlock}`;
//
//   // Retrieve cached data
//   const cachedEntry = db.eventCache ? db.eventCache[cacheKey] : null;
//
//   if (cachedEntry) {
//     return cachedEntry.events; // Return cached events
//   } else {
//     return null; // No cached data found for this block range
//   }
// }
