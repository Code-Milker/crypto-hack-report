import { ATTACKED_WALLET_1, ATTACKED_WALLET_2, ATTACKED_WALLET_3, chainInfoMap } from '../info';
import { ChainId, ChainInfo } from '../types';
import { deleteDb, writeStepData } from '../dbCalls/db';

// Enum for chain IDs

// Create a Map where ChainId enum is the key, and ChainInfo is the value

// Example usage: Retrieve chain info by ChainId
export interface AttackedInformation {
  address: string;
  chains: {
    chainInfo: ChainInfo;
    chainId: ChainId;
    attackRootTransactionHashes: string[];
  }[];
}
const attackInformation: AttackedInformation[] = [
  {
    address: ATTACKED_WALLET_1,
    chains: [
      {
        chainId: ChainId.Ethereum,
        chainInfo: chainInfoMap.get(ChainId.Ethereum) as ChainInfo,
        attackRootTransactionHashes: [
          '0xab98d7cca89bbf1b5aa3008ac7c831d63db19e40a53442ebe489a44eeae69739',
          '0x79b506abb5d86bf3a5f211af79068f83e5bffca064d5c0e030e4f5c5abf937ac',
          '0xc2586fa2135a4a9421576690b7de3d2f20316340bf50278636c7221c402f1d3b',
          '0xcfccaf4a2f883cacdbcba61cd10007d6d23c0d659d6a69b50d01f5718442f67a',
          '0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f',
        ],
      },
      {
        chainId: ChainId.Fantom,
        chainInfo: chainInfoMap.get(ChainId.Fantom) as ChainInfo,
        attackRootTransactionHashes: [
          '0xcee4da0e7bdbb3112b2cd249b459d92c1afc23047db545c33ee60532773736d9',
          '0xc9e8519f3f2e4a4bfa847157a6a77fab7c649a6d586734694ebfa06878f6f2d3',
          '0xbf7d6a7c62dbbe381c6a11c8ead23c0d7c3d3b2e22e8320559e69f08ada05604',
          '0xd48776312e5b60fb9318c439d406b5ea32292aa3fa2cf850f89e0ba05b884eca',
        ],
      },
      {
        chainId: ChainId.Arbitrum,
        chainInfo: chainInfoMap.get(ChainId.Arbitrum) as ChainInfo,
        attackRootTransactionHashes: [
          '0x5795e8df3cb13417d3cd8ac285712c07ad3993b618e604024e4478e376eb7555',
          '0xfce4588fe233d5431af1a6929aa26675103c28470ab09de0cdf72aab63bc8949',
          '0x5795e8df3cb13417d3cd8ac285712c07ad3993b618e604024e4478e376eb7555',
        ],
      },
      {
        chainId: ChainId.Polygon,
        chainInfo: chainInfoMap.get(ChainId.Polygon) as ChainInfo,
        attackRootTransactionHashes: [
          '0xfb34aa1130133f6fdfd644b614fe8f2bfe137696d281d498f7bc2e2f397afb68',
        ],
      },
    ],
  },
  {
    address: ATTACKED_WALLET_2,
    chains: [
      {
        chainId: ChainId.Ethereum,
        chainInfo: chainInfoMap.get(ChainId.Ethereum) as ChainInfo,
        attackRootTransactionHashes: [
          '0x83db357ac4c7a1167052fcfbd59b9c116042b2dc5e005f1f1115b8c936531d52',
          '0xda6ead9539ada8111b8650418d18b0f946b3ab2ac0ad169d8f63a7a00ed2938c',
          '0xaca128aac1feff2a0b9d8ac4c298e44c16b083daad08966f9e0bac5ab7f25193',
          '0x35d924386dbee66d31d7f4faa75572965d39b834a4468cb7f797b749828976d5',
        ],
      },
      {
        chainId: ChainId.Gnosis,
        chainInfo: chainInfoMap.get(ChainId.Gnosis) as ChainInfo,
        attackRootTransactionHashes: [
          '0x991f19459caebd0c0ab5cd09d906bac001146d66a06fa4eda58a50659887d84a',
        ],
      },
    ],
  },
  {
    address: ATTACKED_WALLET_3,
    chains: [
      {
        chainId: ChainId.Ethereum,
        chainInfo: chainInfoMap.get(ChainId.Ethereum) as ChainInfo,
        attackRootTransactionHashes: [
          '0xa2e1103c64aaabf7d6bb188b1af1c60b642adda3ae6be22ea855b41db50ea147',
          '0xe0c238ee1cb53fab18f7daf018f07c159e9aee041dd54b02353ab5fcde38cfac',
        ],
      },
    ],
  },
];
export const step0 = async () => {
  await deleteDb(0);
  const res = await writeStepData(0, attackInformation);
  return res;
};
