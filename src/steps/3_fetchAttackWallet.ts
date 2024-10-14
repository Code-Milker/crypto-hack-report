import { KnownWallets, WalletInformation, KnownWalletsMap } from '../info';
import { fetchStepData, writeStepDataWithTransactionHashIndex } from '../dbCall/db';
import { TransactionContextPath } from '../types';
// Main function to process the transaction
async function fetchAttackWalletsAndPath(
  attacks: {
    transactionContextPath: TransactionContextPath[];
    tokenSplitOrCombinationHash?: string;
  }[],
): Promise<{ wallets: string[]; path: string[]; id: number }[]> {
  // console.log(attacks)
  if (!attacks.length) {
    throw Error('no attacks found');
  }
  const walletThatWasCompromised = attacks[0].transactionContextPath[0].from; // all starting wallets are the victim wallets
  const wallets = attacks.map((a, id) => {
    const wallets: Set<string> = new Set();
    const path: string[] = [];
    a.transactionContextPath.forEach((p, index) => {
      wallets.add(p.from.address);
      wallets.add(p.to.address);
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
  return res.map((a) => {
    const walletsWithInfo: { [address: string]: WalletInformation } = {};
    const updatedWallets = a.wallets.forEach((w, i) => {
      let matchingWallet: WalletInformation = KnownWallets[w] || {
        alias: '',
        type: 'Unknown',
        chainIds: [],
        urlLinks: [],
        associatedAddresses: {},
      };

      if (i === 0) {
        matchingWallet = {
          alias: 'Victims wallet',
          type: 'Victim',
          chainIds: [],
          urlLinks: [],
          associatedAddresses: {},
        };
      }

      walletsWithInfo[w] = matchingWallet;
    });
    // console.log(walletsWithInfo);
    return { ...a, wallets: walletsWithInfo };
    // console.log(knownWalletsMap);
  });
};

export const step3 = async () => {
  const data: {
    [transactionHash: string]: {
      transactionContextPath: TransactionContextPath[];
      tokenSplitOrCombinationHash?: string;
    }[];
  } = await fetchStepData(2);
  const transactions = await Promise.all(
    Object.keys(data).map(async (key) => {
      if (data[key].length) {
        const addressesInvolved = await fetchAttackWalletsAndPath(data[key]);
        const addressesIdentity = lookUpKnownWallets(addressesInvolved);
        return {
          [key]: addressesIdentity,
        };
      }
      return { [key]: [] };
    }),
  );
  let transactionsObj = {};
  transactions.forEach((t) => {
    console.log(t);
    transactionsObj = { ...transactionsObj, ...t };
  });
  console.log(transactionsObj);
  for (const [key, value] of Object.entries(transactionsObj)) {
    // console.log({ key, value })
    await writeStepDataWithTransactionHashIndex(3, value, key);
  }
};

// if (index === 0) {
//   WALLET_THAT_WAS_COMPROMISED
// }
