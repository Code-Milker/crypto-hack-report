import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import {
  RawTransactionAttackWithMetaData,
} from './types';
import 'dotenv/config'; // Loads .env variables into process.env
import { buildTransactionPath, createProvider, fetchTransactionPathDetails, getFileName } from './utils';

export const fetchTransaction = async (attack: RawTransactionAttackWithMetaData) => {
  const fileName = getFileName(attack);
  const provider = createProvider(attack.rpcUrl);
  const dirPath = path.dirname(fileName);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true }); // Create directory if it doesn't exist
  }

  // Build the transaction path from the attack
  const transactionPathFromAttack = buildTransactionPath(attack);

  // Fetch the transaction path details
  const attackDetails = await fetchTransactionPathDetails(transactionPathFromAttack, provider);

  // If the file already exists, delete it to clear it
  if (existsSync(fileName)) {
    unlinkSync(fileName);
  }

  // Write the output to the file
  console.log(JSON.stringify(attackDetails, null, 2));
  writeFileSync(fileName, JSON.stringify(attackDetails, null, 2));
};
