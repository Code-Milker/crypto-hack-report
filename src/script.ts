import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { RawTransactionAttack, TransactionPathFromAttack } from './types';
import 'dotenv/config'; // Loads .env variables into process.env
import { buildTransactionPath, fetchTransactionPathDetails } from './utils';
export const getTransactionPathContextForAttack = async (
  rawTransactionAttack: RawTransactionAttack,
  fileName: string,
) => {
  const transactionPathFromAttack = buildTransactionPath(rawTransactionAttack);
  const attackDetails = await fetchTransactionPathDetails(transactionPathFromAttack);
  // If the file already exists, delete it
  if (existsSync(fileName)) {
    unlinkSync(fileName); // Clear the file by deleting it
  }
  // Write the output to the file
  console.log(JSON.stringify(attackDetails, null, 2));
  writeFileSync(fileName, JSON.stringify(attackDetails, null, 2));
};
