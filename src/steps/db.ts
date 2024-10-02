
import { promises as fs } from 'fs';
import jsonfile from 'jsonfile';

export const stepFileDb = 'db/attack-information.json'
export const getDb = async () => {
  const fileExist = await checkFileExists(stepFileDb)
  const db = fileExist ? await jsonfile.readFile(stepFileDb) : {}
}
async function checkFileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;  // File exists
  } catch {
    return false; // File does not exist
  }
}

export const fetchStepData = async (step: number) => {
  const fileExists = checkFileExists(stepFileDb)
  if (!fileExists) {
    throw Error('file does not exist')

  }
  const db = await jsonfile.readFile(stepFileDb)
  if (!db[step]) {
    throw Error(`step ${step} does not exist`)
  }
  return db[step]
}

export const writeStepData = async (step: number, data: any) => {
  const db = getDb();
  if (Object.keys(db).length === 0 && step !== 0) {
    throw Error('DB is empty, generate from 0')
  }

  const updatedDb = { ...db, [step]: data }
  await jsonfile.writeFile(stepFileDb, updatedDb, { spaces: 2 });
  console.log(`successfully wrote data for step ${step}`)
}
