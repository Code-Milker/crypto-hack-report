
import * as fs from 'fs';
import { TransactionContextPath } from '../types';
import { processTransaction } from './2_fetchAttackPath'


// Function to read JSON file and parse it
// function readTransactionData(filePath: string): TransactionContextPath {
//   const rawData = fs.readFileSync(filePath, 'utf-8');
//   return JSON.parse(rawData);
// }
//

// Recursive function to follow the transaction path


// Main function to process the transaction
async function fetchAttackWallets(filePath: string): Promise<any> {
  const attacks = await processTransaction(filePath)
  console.log(attacks)
  const wallets = attacks.map(a => {
    const wallets = new Set()
    const path: string[] = []
    a.transactionContextPath.forEach((p) => {
      wallets.add(p.from)
      wallets.add(p.to)
      path.push(p.transactionHash)
    })
    return { wallets: Array.from(wallets), path }
  })
  console.log(wallets)
  return wallets
}
const res = fetchAttackWallets('./output/test.json').then(console.log)
