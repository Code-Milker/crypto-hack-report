import attacksDataCd27 from '../input/0xc24daD96e21a6cd97C263BF85B874e445469CD27.json';
import { ATTACKED_WALLET_1 } from './info';
import { RawTransactionAttack, RawTransactionMetaData } from './types';
import { fetchTransaction } from './utils';
export const attacksOnEachChain: {
  transactions: RawTransactionAttack[];
  metaData: RawTransactionMetaData;
}[] = [
    {
      metaData: { chainId: '1', chain: 'Mainnet', wallet: ATTACKED_WALLET_1, rpcUrl: 'https://polygon-mainnet.infura.io/v3/5e6e5a11eb5f492792fb05057a80a602' },
      transactions: [
        {
          tokenSymbol: 'BTC',
          rootTransaction: '',
          transactionsPaths: [['']],
        },
      ],
    }
  ];

attacksDataCd27.forEach((chain) => {
  chain.transactions.forEach(async (attack) => {
    await fetchTransaction({
      ...chain.metaData,
      ...attack,
    });
  })
})
//
