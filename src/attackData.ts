
import { ATTACKED_WALLET_1 } from './info';
import { getTransactionPathContextForAttack } from './script';
import { TransactionPathFromAttack } from './types';
import { buildTransactionPath, getFileName } from './utils';

const linkAttack: { rootTransaction: string, transactionsPaths: string[][] } = {
  rootTransaction: '0xab98d7cca89bbf1b5aa3008ac7c831d63db19e40a53442ebe489a44eeae69739',
  transactionsPaths: [
    [
      "0x33abd1a86623f7f8835651a7ed58ee2526453202a29f333fa763d32a7db40586",
      "0x7409b2b9372e18443108bc61693501e3376ce4667143a58fa37e4953052fab01",
      "0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5"
    ],
    [
      "0xfece33b64d1a857f0b107decc155473a781a617c1715230944585c5e836d18cd",
      "0xd25e21af912f6626e95591fb8d2019018778158a4ce8de83c345024ecdd81255",
      "0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5"
    ],
    [
      "0xdd2a094c55b9cb6d867c4ec1ea1f6f9653f86ddad1c65bb9fabad06ed6e1c31a",
      "0x84dad981273f8584c74e26206ff6a8b0f9982f0efc2fa2cbc6df206adfe493d5",
      "0x969acbde1b4c2a74488e45b63bff6d9397cd37b892ad9d4808615cca69808929",
      "0xb0c2155acc9c2a730eaa411ba854b60db35ba40be245cd3bac1a1f666d372015"
    ],
    [
      "0x43649757766aa8ac20eba724b4fa6f5b7d0a88ce893fd3f1ef85e30c85f838cb",
      "0x5273406225297282ca8b48925842f19ae5c5a0c1f242fbc8d97571497bc3ffb5",
      "0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5"
    ]
  ]
}
// Usage
// export const chainLinkAttack: TransactionPathFromAttack = {
//   transactionHash: '0xab98d7cca89bbf1b5aa3008ac7c831d63db19e40a53442ebe489a44eeae69739',
//   nextTransactions: [
//     // Path for Attack 1
//     {
//       transactionHash: '0x33abd1a86623f7f8835651a7ed58ee2526453202a29f333fa763d32a7db40586',
//       nextTransactions: [
//         {
//           transactionHash: '0x7409b2b9372e18443108bc61693501e3376ce4667143a58fa37e4953052fab01',
//           nextTransactions: [
//             {
//               transactionHash: '0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5',
//               nextTransactions: [],
//             },
//           ],
//         },
//       ],
//     },
//     // Path for Attack 2
//     {
//       transactionHash: '0xfece33b64d1a857f0b107decc155473a781a617c1715230944585c5e836d18cd',
//       nextTransactions: [
//         {
//           transactionHash: '0xd25e21af912f6626e95591fb8d2019018778158a4ce8de83c345024ecdd81255',
//           nextTransactions: [
//             {
//               transactionHash: '0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5',
//               nextTransactions: [],
//             },
//           ],
//         },
//       ],
//     },
//     // Path for Attack 3
//     {
//       transactionHash: '0xdd2a094c55b9cb6d867c4ec1ea1f6f9653f86ddad1c65bb9fabad06ed6e1c31a',
//       nextTransactions: [
//         {
//           transactionHash: '0x84dad981273f8584c74e26206ff6a8b0f9982f0efc2fa2cbc6df206adfe493d5',
//           nextTransactions: [
//             {
//               transactionHash: '0x969acbde1b4c2a74488e45b63bff6d9397cd37b892ad9d4808615cca69808929',
//               nextTransactions: [
//                 {
//                   transactionHash: '0xb0c2155acc9c2a730eaa411ba854b60db35ba40be245cd3bac1a1f666d372015',
//                   nextTransactions: [],
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//     // Path for Attack 4
//     {
//       transactionHash: '0x43649757766aa8ac20eba724b4fa6f5b7d0a88ce893fd3f1ef85e30c85f838cb',
//       nextTransactions: [
//         {
//           transactionHash: '0x5273406225297282ca8b48925842f19ae5c5a0c1f242fbc8d97571497bc3ffb5',
//           nextTransactions: [
//             {
//               transactionHash: '0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5',
//               nextTransactions: [],
//             },
//           ],
//         },
//       ],
//     },
//   ],
// };

// Main function to run the script

const fileName = getFileName(ATTACKED_WALLET_1, 'LINK');

const transactionPathFromAttack = buildTransactionPath(linkAttack);
getTransactionPathContextForAttack(transactionPathFromAttack, fileName).then().catch(console.log)
