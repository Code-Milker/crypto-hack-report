import { WalletType, KnownWallets, WalletInformation, KnownWalletsMap } from '../info';
import { fetchStepData, writeStepDataWithTransactionHashIndex } from './db';
import { TransactionContextPath } from '../types';
// Main function to process the transaction
async function fetchAttackWalletsAndPath(attacks: { transactionContextPath: TransactionContextPath[]; tokenSplitOrCombinationHash?: string }[]
): Promise<{ wallets: string[]; path: string[]; id: number }[]> {
  if (!attacks.length) {
    throw Error('no attacks found');
  }
  const walletThatWasCompromised = attacks[0].transactionContextPath[0].from; // all starting wallets are the victim wallets
  const wallets = attacks.map((a, id) => {
    const wallets: Set<string> = new Set();
    const path: string[] = [];
    a.transactionContextPath.forEach((p, index) => {
      wallets.add(p.from);
      wallets.add(p.to);
      path.push(p.transactionHash);
    });
    return {
      wallets: Array.from(wallets),
      path,
      id: id + 1,
      walletThatWasCompromised,
      amount: '',
      tokenAddress: '',
      tokenName: '',
      dollarValue: '',
    };
  });
  return wallets;
}
const lookUpKnownWallets = (res: { wallets: string[]; path: string[]; id: number }[]) => {

  res.forEach((a) => {
    let knownWalletsMap: KnownWalletsMap = {};
    a.wallets.forEach((w) => {
      const matchingWallet: WalletInformation = KnownWallets[w] || {
        alias: '',
        type: 'Unknown',
        chainIds: [],
        urlLinks: [],
        associatedAddresses: {},
      };
      knownWalletsMap = { ...knownWalletsMap, [w]: matchingWallet };

      // const walletDetail = { address: w, walletType: '' };
    });
    console.log(knownWalletsMap);
  });
}

const main = async () => {
  const data: { [transactionHash: string]: { transactionContextPath: TransactionContextPath[]; tokenSplitOrCombinationHash?: string }[] } = await fetchStepData(2);
  const transactions = await Promise.all(Object.keys(data).map(async key => {
    const walletAndPaths = await fetchAttackWalletsAndPath(data[key])
    const walletAndPathsWithKnowWallets = lookUpKnownWallets(walletAndPaths);
    return { [key]: walletAndPathsWithKnowWallets }
  }))

  console.log(JSON.stringify(transactions, null, 2));
};
main();
// if (index === 0) {
//   WALLET_THAT_WAS_COMPROMISED
// }
