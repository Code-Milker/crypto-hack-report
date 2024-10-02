import { processTransaction } from './2_fetchAttackPath';
import { WalletType, KnownWallets, WalletInformation, KnownWalletsMap } from '../info';


// Main function to process the transaction
async function fetchAttackWalletsAndPath(
  filePath: string,
): Promise<{ wallets: string[]; path: string[]; id: number }[]> {
  const attacks = await processTransaction(filePath);
  if (!attacks.length) {
    throw Error('no attacks found');
  }
  const walletThatWasCompromised = attacks[0].transactionContextPath[0].from; // all starting wallets are the victim wallets
  console.log(attacks);
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

const main = async () => {
  const res = await fetchAttackWalletsAndPath('./output/test.json');
  console.log(res);
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
};
main();
// if (index === 0) {
//   WALLET_THAT_WAS_COMPROMISED
// }
