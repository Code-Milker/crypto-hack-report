import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { TransactionPathFromAttack } from './types';
import 'dotenv/config'; // Loads .env variables into process.env
import { fetchTransactionPathDetails } from './utils';
export const getTransactionPathContextForAttack = async (transactionPathFromAttack: TransactionPathFromAttack, fileName: string) => {
  const attackDetails = await fetchTransactionPathDetails(transactionPathFromAttack);
  // If the file already exists, delete it
  if (existsSync(fileName)) {
    unlinkSync(fileName); // Clear the file by deleting it
  }
  // Write the output to the file
  writeFileSync(fileName, JSON.stringify(attackDetails, null, 2));
};
