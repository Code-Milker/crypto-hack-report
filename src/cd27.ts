import { ATTACKED_WALLET_1 } from './info';
import { fetchTransaction, getTransactionPathContextForAttack } from './script';
import { RawTransactionAttack, RawTransactionMetaData, TransactionPathFromAttack } from './types';
import { buildTransactionPath, getFileName } from './utils';

export const attacksOnMainnet: {
  transactions: RawTransactionAttack[];
  metaData: RawTransactionMetaData;
} = {
  metaData: { chainId: '1', chain: 'Ethereum', wallet: ATTACKED_WALLET_1 },
  transactions: [
    {
      rootTransaction: '0xab98d7cca89bbf1b5aa3008ac7c831d63db19e40a53442ebe489a44eeae69739',
      tokenSymbol: 'LINK',
      transactionsPaths: [
        [
          '0x33abd1a86623f7f8835651a7ed58ee2526453202a29f333fa763d32a7db40586',
          '0x7409b2b9372e18443108bc61693501e3376ce4667143a58fa37e4953052fab01',
          '0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5',
        ],
        [
          '0xfece33b64d1a857f0b107decc155473a781a617c1715230944585c5e836d18cd',
          '0xd25e21af912f6626e95591fb8d2019018778158a4ce8de83c345024ecdd81255',
          '0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5',
        ],
        [
          '0xdd2a094c55b9cb6d867c4ec1ea1f6f9653f86ddad1c65bb9fabad06ed6e1c31a',
          '0x84dad981273f8584c74e26206ff6a8b0f9982f0efc2fa2cbc6df206adfe493d5',
          '0x969acbde1b4c2a74488e45b63bff6d9397cd37b892ad9d4808615cca69808929',
          '0xb0c2155acc9c2a730eaa411ba854b60db35ba40be245cd3bac1a1f666d372015',
        ],
        [
          '0x43649757766aa8ac20eba724b4fa6f5b7d0a88ce893fd3f1ef85e30c85f838cb',
          '0x5273406225297282ca8b48925842f19ae5c5a0c1f242fbc8d97571497bc3ffb5',
          '0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5',
        ],
      ],
    },
    {
      tokenSymbol: 'USDC',
      rootTransaction: '0x79b506abb5d86bf3a5f211af79068f83e5bffca064d5c0e030e4f5c5abf937ac',
      transactionsPaths: [
        [
          '0xeea894837701ac6bc4ada0a0c2bfd653ca1b0523edd5f751fc1534a4e3422577',
          '0x84e884f614b0a5a7cb5bee8f2133e9ba908220569b0f76b681be4b993662fffc',
          '0x4dc8805d99c2ad62ba9bd3f2303f010c76053d0013a1a209c7a736e96560485c',
          '0xcb40c89ba73f47272a0fe9e1f921ef15e80c3d1b14bfdb90f60178f2a088abfe',
        ],
      ],
    },

    {
      tokenSymbol: 'SAND',
      rootTransaction: '0xcfccaf4a2f883cacdbcba61cd10007d6d23c0d659d6a69b50d01f5718442f67a',
      transactionsPaths: [
        [
          '0xabcf08c7b11ba94754ef849ce9d2b8926fefac6c33d80bae2cb660f24e3458fe',
          '0xeea894837701ac6bc4ada0a0c2bfd653ca1b0523edd5f751fc1534a4e3422577',
          '0x84e884f614b0a5a7cb5bee8f2133e9ba908220569b0f76b681be4b993662fffc',
          '0x4dc8805d99c2ad62ba9bd3f2303f010c76053d0013a1a209c7a736e96560485c',
          '0xcb40c89ba73f47272a0fe9e1f921ef15e80c3d1b14bfdb90f60178f2a088abfe',
        ],
      ],
    },
    {
      tokenSymbol: 'WETH',
      rootTransaction: '0xc2586fa2135a4a9421576690b7de3d2f20316340bf50278636c7221c402f1d3b',
      transactionsPaths: [
        [
          '0x6c5bef6303190c36c413f1e28fb27c40fb2afe821b5ed2c7fec9acd8e5856d0c',
          '0xeea894837701ac6bc4ada0a0c2bfd653ca1b0523edd5f751fc1534a4e3422577',
          '0x84e884f614b0a5a7cb5bee8f2133e9ba908220569b0f76b681be4b993662fffc',
          '0x4dc8805d99c2ad62ba9bd3f2303f010c76053d0013a1a209c7a736e96560485c',
          '0xcb40c89ba73f47272a0fe9e1f921ef15e80c3d1b14bfdb90f60178f2a088abfe',
        ],
      ],
    },
    {
      tokenSymbol: 'ETH',
      rootTransaction: '0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f',
      transactionsPaths: [
        [
          '0x92ad4527c5204ee8d68123e541e5ff4d01ee390c01f3a923429bd75769f88391',
          '0xa6c5d2a50c5818fb9346001cb095d0d110668cc9d334ba57757ed16e77bca5a1',
          '0x5921b94900b3ebb65a02f9b4f008a8d8a37ad1a6860f0824904c64974c5e9f9f',
        ],
      ],
    },
  ],
};

// attacksOnMainnet.transactions.forEach(async (attack) => {
// if (attack.tokenSymbol !== 'ETH') {
//   return;
// }
//   fetchTransaction({
//     ...attacksOnMainnet.metaData,
//     ...attack,
//   });
// });

export const attacksOnPolygon: {
  transactions: RawTransactionAttack[];
  metaData: RawTransactionMetaData;
} = {
  metaData: { chainId: '137', chain: 'Polygon', wallet: ATTACKED_WALLET_1 },
  transactions: [
    {
      tokenSymbol: 'DAI',
      rootTransaction: '0xfb34aa1130133f6fdfd644b614fe8f2bfe137696d281d498f7bc2e2f397afb68',
      transactionsPaths: [['0xeeeb461fdec29125fae93d85dd91b5ac320fdfc54db65b2bac0c54733f7a75e2']],
    },
  ],
};

export const attackOnArbitrum: {
  transactions: RawTransactionAttack[];
  metaData: RawTransactionMetaData;
} = {
  metaData: { chainId: '42161', chain: 'Arbitrum One (Mainnet)', wallet: ATTACKED_WALLET_1 },
  transactions: [
    {
      tokenSymbol: 'ETH',
      rootTransaction: '0x5795e8df3cb13417d3cd8ac285712c07ad3993b618e604024e4478e376eb7555',
      transactionsPaths: [
        [
          '0xf1376da4888b9af95f78a4b8d32173c8bb5283f64f0bb038f1b10d0b194d0c22',
          '0xef045e65f42b5a6507570292aedb038cf9d4b7495aab48a786e23e210b727449',
          '0x9aeff84852020c43607aed317cd85f1803f41effcb461f2474248f87ff45c767',
        ],
      ],
    },
    {
      tokenSymbol: 'WTBC',
      rootTransaction: '0xfce4588fe233d5431af1a6929aa26675103c28470ab09de0cdf72aab63bc8949',
      transactionsPaths: [
        [
          '0xe849512eca73933d9607d8e4bdf8d7a1a81197a279f0cde2b58157fa0aa0e01c',
          '0x3e5eeb2abb54ffd004b1131788144462c371b0073cceafa89676aac55e16c584',
        ],
        [
          '0x0678514c663fb4d4837fd7740a2ae6dddbe882fa9dc41157ffe6ce3a88996556',
          '0xb2a7038b869c0b75c10d85bddf9c208954cbb1e66d7404218cc2da6cf1dc391e',
        ],
      ],
    },
  ],
};

export const attackOnFantom: {
  transactions: RawTransactionAttack[];
  metaData: RawTransactionMetaData;
} = {
  metaData: { chainId: '250', chain: 'Fantom Mainnet', wallet: ATTACKED_WALLET_1 },
  transactions: [
    {
      tokenSymbol: 'FTM',
      rootTransaction: '0xcee4da0e7bdbb3112b2cd249b459d92c1afc23047db545c33ee60532773736d9',
      transactionsPaths: [
        [
          '0x99dab5787142c01c30c5a53389ecaa3d0b3392a4577a984fb1dc3ea605286341',
          '0x11d4f1bb3aea2556900815b9c8c45b3a9e4dbc062645249f79bffec89fc71331',
          '0xe9f49c8f645bc533724edc4107ae81e120e4380bc18410536967b6f4d2e2b332',
          '0x6ad2deafeefcae0ada01b65e0edaddd7712dcd8864487e95f1b47f12c5e28589',
          '0x9e24feff908a930a957cdc0e00d239e9731e143448dfc5d41d5e89c752dfa8c3',
        ],
        [
          '0x8069eb5b65d4d7dc0d63a5d9ad833952ca4b8877f5bac2b283277b09ac754bc4',
          '0xd7efdd065c82a40c615fd70ec63260636e036e865c6ec722cac0d0c587b21a4e',
          '0xe9f49c8f645bc533724edc4107ae81e120e4380bc18410536967b6f4d2e2b332',
          '0x22d523cfa64662149ee9ef91978f23c15362bc0fbd8a70f97f0ef45a47587611',
          '0xaa0f9c2e4e426a065aadf6ca2f339db51e0233ea504f86cf528835c3a8547b7c',
        ],
      ],
    },
    {
      tokenSymbol: 'EQUAL',
      rootTransaction: '0xc9e8519f3f2e4a4bfa847157a6a77fab7c649a6d586734694ebfa06878f6f2d3',
      transactionsPaths: [
        ['0xc801e29d9cbc29865a67a134a87cd37e82059be7389e5bcbc29c25ac1f1eab16'],
        [
          '0xd48776312e5b60fb9318c439d406b5ea32292aa3fa2cf850f89e0ba05b884eca',
          '0xc801e29d9cbc29865a67a134a87cd37e82059be7389e5bcbc29c25ac1f1eab16',
        ],
      ],
    },
    {
      tokenSymbol: 'BOO',
      rootTransaction: '0xc9e8519f3f2e4a4bfa847157a6a77fab7c649a6d586734694ebfa06878f6f2d3',
      transactionsPaths: [['0xb75e482db55d003013d872bce43333eeb4b441d8c978d0ef263c7360efd004fa']],
    },
  ],
};
