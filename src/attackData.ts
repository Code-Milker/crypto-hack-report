import { ATTACKED_WALLET_1 } from './info';
import { getTransactionPathContextForAttack } from './script';
import { RawTransactionAttack, TransactionPathFromAttack } from './types';
import { buildTransactionPath, getFileName } from './utils';

const linkAttack: RawTransactionAttack = {
  rootTransaction: '0xab98d7cca89bbf1b5aa3008ac7c831d63db19e40a53442ebe489a44eeae69739',
  wallet: ATTACKED_WALLET_1,
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
};
const usdcAttack: RawTransactionAttack = {
  wallet: ATTACKED_WALLET_1,
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
};

const sandboxAttack: RawTransactionAttack = {
  wallet: ATTACKED_WALLET_1,
  tokenSymbol: 'SAND',
  rootTransaction: '0xcfccaf4a2f883cacdbcba61cd10007d6d23c0d659d6a69b50d01f5718442f67a',
  transactionsPaths: [],
};
const fetchTransaction = (attack: RawTransactionAttack) => {
  const fileName = getFileName(attack.wallet, attack.tokenSymbol);
  getTransactionPathContextForAttack(attack, fileName).then().catch(console.log);
};
fetchTransaction(linkAttack);
