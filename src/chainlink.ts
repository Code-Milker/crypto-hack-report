interface TransactionAttack {
  id: number;
  transactionHash: string;
  tokenName: string;
  from: string;
  to: string;
  info?: string;
  tokenAmount: number;
  toAddressWasfundedBy?: {
    address: string;
    info: string;
    transactionHash: string;
  }[];
}
const chainlinkTransactionFlow1: Array<TransactionAttack> = [
  {
    id: 1,
    transactionHash: '0xab98d7cca89bbf1b5aa3008ac7c831d63db19e40a53442ebe489a44eeae69739',
    tokenName: 'Chainlink',
    from: '0xc24daD96e21a6cd97C263BF85B874e445469CD27',
    to: '0xcB56731B552537170C0296343184Ffa68c056C0C',
    toAddressWasfundedBy: [
      {
        address: '0xc24daD96e21a6cd97C263BF85B874e445469CD27',
        transactionHash: '0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f',
        info: 'they used funds from my account to use gas',
      },
    ],
    tokenAmount: 7371.61859191,
  },
  {
    id: 2,
    transactionHash: '0x33abd1a86623f7f8835651a7ed58ee2526453202a29f333fa763d32a7db40586',
    tokenName: 'Chainlink',
    from: '0xcB56B65F8F99eE48ce0544f62122CfC10e086C0c',
    to: '0xc9958429B77224CF68646345699791634d993268',

    toAddressWasfundedBy: [
      {
        info: 'inital funding',
        address: '0xafd99a1a7e2195a8E0fdB6e8bD45EFDff15FEadD',
        transactionHash: '0x409de884c5631b40e6683633a43f5e7ab9191f620e1336a790423762cc3bd183',
      },
      {
        info: 'simple swap ',
        address: '0x4B0401Fe6B84C52d4F4310c371c731a2B6D0964D',
        transactionHash: '0xb7cd4a163bb2a706088f617f28c55af052a7ca383b57a3ab8f563381de0b7250',
      },
    ],
    tokenAmount: 2000,
  },
  {
    id: 3,
    transactionHash: '0x7409b2b9372e18443108bc61693501e3376ce4667143a58fa37e4953052fab01',
    tokenName: 'Chainlink',
    from: '0xc9958429B77224CF68646345699791634d993268',
    to: '0x18C4bf7c470069B9d18B6A5670E457De3983C299',

    toAddressWasfundedBy: [
      {
        address: '0xafd99a1a7e2195a8E0fdB6e8bD45EFDff15FEadD',
        transactionHash: '0x3a62d93e584a26e6eb057f3f72aeaec569e13aa965e4d7665bdc48598dbbf368',
        info: 'inital funding',
      },
      {
        address: '0x4B0401Fe6B84C52d4F4310c371c731a2B6D0964D',
        transactionHash: '0xb7cd4a163bb2a706088f617f28c55af052a7ca383b57a3ab8f563381de0b7250',
        info: 'simple swap',
      },
    ],
    info: 'specific deposit address for binance user',
    tokenAmount: 2000,
  },
  {
    id: 4,
    transactionHash: '0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5',
    tokenName: 'Chainlink',
    from: '0x18C4bf7c470069B9d18B6A5670E457De3983C299',
    to: '0x28C6c06298d514Db089934071355E5743bf21d60',
    info: 'this is the binance 14 account where they cash out',
    tokenAmount: 4871.6,
  },
];
const chainlinkTransactionFlow2: Array<TransactionAttack> = [
  {
    id: 1,
    transactionHash: '0xab98d7cca89bbf1b5aa3008ac7c831d63db19e40a53442ebe489a44eeae69739',
    tokenName: 'Chainlink',
    from: '0xc24daD96e21a6cd97C263BF85B874e445469CD27',
    to: '0xcB56731B552537170C0296343184Ffa68c056C0C',
    toAddressWasfundedBy: [
      {
        address: '0xc24daD96e21a6cd97C263BF85B874e445469CD27',
        transactionHash: '0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f',
        info: 'they used funds from my account to use gas',
      },
    ],
    tokenAmount: 7371.61859191,
  },
  {
    id: 2,
    transactionHash: '0xfece33b64d1a857f0b107decc155473a781a617c1715230944585c5e836d18cd',
    tokenName: 'Chainlink',
    from: '0xcB56B65F8F99eE48ce0544f62122CfC10e086C0c',
    to: '0x7F6cd6FAeC4C9F0652EC246Cf630aE85872ad0aA',
    toAddressWasfundedBy: [
      {
        address: '0xafd99a1a7e2195a8E0fdB6e8bD45EFDff15FEadD',
        transactionHash: '0xc8ab2680ddb6a00a4fdd6d20f4e8446c17defadb88a58e9ec60a874999e0ef86',
        info: 'inital funding',
      },
      {
        address: '0x4B0401Fe6B84C52d4F4310c371c731a2B6D0964D',
        info: 'simple swap',
        transactionHash: '0xb7cd4a163bb2a706088f617f28c55af052a7ca383b57a3ab8f563381de0b7250',
      },
    ],
    tokenAmount: 2000,
  },
  {
    id: 3,
    transactionHash: '0xd25e21af912f6626e95591fb8d2019018778158a4ce8de83c345024ecdd81255',
    tokenName: 'Chainlink',
    from: '0x7F6cd6FAeC4C9F0652EC246Cf630aE85872ad0aA',
    to: '0x18C4bf7c470069B9d18B6A5670E457De3983C299',
    toAddressWasfundedBy: [
      {
        address: '0xafd99a1a7e2195a8E0fdB6e8bD45EFDff15FEadD',
        info: 'intial deposit',
        transactionHash: '0x3a62d93e584a26e6eb057f3f72aeaec569e13aa965e4d7665bdc48598dbbf368',
      },
      {
        address: '0x4B0401Fe6B84C52d4F4310c371c731a2B6D0964D',
        info: 'simple swap',
        transactionHash: '0xb7cd4a163bb2a706088f617f28c55af052a7ca383b57a3ab8f563381de0b7250',
      },
    ],
    info: 'specific deposit address for binance user',
    tokenAmount: 2000,
  },

  {
    id: 4,
    transactionHash: '0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5',
    tokenName: 'Chainlink',
    from: '0x18C4bf7c470069B9d18B6A5670E457De3983C299',
    to: '0x28C6c06298d514Db089934071355E5743bf21d60',
    info: 'this is the binance 14 account where they cash out',
    tokenAmount: 4871.6,
  },
];

const chainlinkTransactionFlow3: Array<TransactionAttack> = [
  {
    id: 1,
    transactionHash: '0xab98d7cca89bbf1b5aa3008ac7c831d63db19e40a53442ebe489a44eeae69739',
    tokenName: 'Chainlink',
    from: '0xc24daD96e21a6cd97C263BF85B874e445469CD27',
    to: '0xcB56731B552537170C0296343184Ffa68c056C0C',
    toAddressWasfundedBy: [
      {
        address: '0xc24daD96e21a6cd97C263BF85B874e445469CD27',
        transactionHash: '0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f',
        info: 'they used funds from my account to use gas',
      },
    ],
    tokenAmount: 7371.61859191,
  },
  {
    id: 2,
    transactionHash: '0xdd2a094c55b9cb6d867c4ec1ea1f6f9653f86ddad1c65bb9fabad06ed6e1c31a',
    tokenName: 'Chainlink',
    from: '0xcB56B65F8F99eE48ce0544f62122CfC10e086C0c',
    to: '0x1Ea3faE35fd0D260D1d5B060c15228024D3B1cF2',
    toAddressWasfundedBy: [
      {
        address: '0xA4e5961B58DBE487639929643dCB1Dc3848dAF5E',
        transactionHash: '0xa12c0203ae2b26c01c2d82105299aa4a02284bafbe5a1ca38fea272a2ebb54c7',
        info: 'sent funds from simple swap to fund',
      },
    ],
    tokenAmount: 2500,
  },
  {
    id: 3,
    transactionHash: '0x84dad981273f8584c74e26206ff6a8b0f9982f0efc2fa2cbc6df206adfe493d5',
    tokenName: 'Chainlink',
    from: '0x1Ea3faE35fd0D260D1d5B060c15228024D3B1cF2',
    to: '0xD72CD83aFba0dCfEFf95D463adcB2b8dEf6aA623',
    toAddressWasfundedBy: [
      {
        address: '0xA2768dF0b1fb437d5d238d5d0E9b7Ca584e84628',
        info: 'Initial funding account',
        transactionHash: '0xc76899d2d37ea401e840c931b7738c0b5177d6c551bef8ca9d61ff2ef9ce6c07',
      },
      {
        address: '0xB8bd60cd6a1108E8bF5113F4a3D27B8EAdABA551',
        info: 'Second funding account',
        transactionHash: '0x85294fb846d7d7b8d04b8c8be2941f0482496a80a7242b93e94d7606abf602d2',
      },
      {
        address: '0x4356FF583413836CE64FE99dd8b3eF452D9AdD96',
        info: 'Third funding account',
        transactionHash: '0x5728ab7ad272f83e111f382d484aa3edc94aa9f2d606ee79623da7840adb62ed',
      },
      {
        address: '0xC77860eEaE42D54b08e4471A4969c9AACdfAdB81',
        info: 'Fourth funding account',
        transactionHash: '0x667f20f31d5cbb6f7554a4212d20aee47ff892731b8ecdad6f853fb75817c518',
      },
      {
        address: '0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0',
        info: 'Kraken 4',
        transactionHash: '0x882b47921978697b82ea628cc0185c461588310ba5370cc6836f029f88f3ffa6',
      },
    ],
    tokenAmount: 2500,
  },
  {
    id: 4,
    transactionHash: '0x969acbde1b4c2a74488e45b63bff6d9397cd37b892ad9d4808615cca69808929',
    tokenName: 'Chainlink',
    from: '0xD72CD83aFba0dCfEFf95D463adcB2b8dEf6aA623',
    to: '0x19F00b3a7B6F55C9dA966FE3723251784a797fa7',
    info: 'the to is there specfic deposit address on binance',
    tokenAmount: 3297.48538,
  },
  {
    id: 5,
    transactionHash: '0xb0c2155acc9c2a730eaa411ba854b60db35ba40be245cd3bac1a1f666d372015',
    tokenName: 'Chainlink',
    from: '0x19F00b3a7B6F55C9dA966FE3723251784a797fa7',
    to: '0x28C6c06298d514Db089934071355E5743bf21d60',
    tokenAmount: 3297.48538,
    info: 'this is the binance 14 account where they cash out',
  },
];
//
const chainlinkTransactionFlow4: Array<TransactionAttack> = [
  {
    id: 1,
    transactionHash: '0xab98d7cca89bbf1b5aa3008ac7c831d63db19e40a53442ebe489a44eeae69739',
    tokenName: 'Chainlink',
    from: '0xc24daD96e21a6cd97C263BF85B874e445469CD27',
    to: '0xcB56731B552537170C0296343184Ffa68c056C0C',
    toAddressWasfundedBy: [
      {
        address: '0xc24daD96e21a6cd97C263BF85B874e445469CD27',
        transactionHash: '0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f',
        info: 'they used funds from my account to use gas',
      },
    ],
    tokenAmount: 7371.61859191,
  },
  {
    id: 2,
    transactionHash: '0x43649757766aa8ac20eba724b4fa6f5b7d0a88ce893fd3f1ef85e30c85f838cb',
    tokenName: 'Chainlink',
    from: '0xcB56B65F8F99eE48ce0544f62122CfC10e086C0c',
    to: '0x1614308b4a24459F1CF6167bc0068a621f834Da1',
    toAddressWasfundedBy: [
      {
        address: '0xafd99a1a7e2195a8E0fdB6e8bD45EFDff15FEadD',
        transactionHash: '0xf641f54b99bbd655d903d9acc4f181c89fcf6c401ca7e02156ea6a3b4c467113',
        info: 'inital funding',
      },
      {
        address: '0x4B0401Fe6B84C52d4F4310c371c731a2B6D0964D',
        transactionHash: '0xb7cd4a163bb2a706088f617f28c55af052a7ca383b57a3ab8f563381de0b7250',
        info: 'simple swap',
      },
    ],
    tokenAmount: 871.6,
  },
  {
    id: 3,
    transactionHash: '0x5273406225297282ca8b48925842f19ae5c5a0c1f242fbc8d97571497bc3ffb5',
    tokenName: 'Chainlink',
    from: '0x1614308b4a24459F1CF6167bc0068a621f834Da1',
    to: '0x18C4bf7c470069B9d18B6A5670E457De3983C299',
    info: 'specific deposit address for binance user',
    tokenAmount: 871.6,
    toAddressWasfundedBy: [
      {
        address: '0xafd99a1a7e2195a8E0fdB6e8bD45EFDff15FEadD',
        info: 'Initial funding account',
        transactionHash: '0xf641f54b99bbd655d903d9acc4f181c89fcf6c401ca7e02156ea6a3b4c467113',
      },
      {
        address: '0x4B0401Fe6B84C52d4F4310c371c731a2B6D0964D',
        info: 'simple swap',
        transactionHash: '0xb7cd4a163bb2a706088f617f28c55af052a7ca383b57a3ab8f563381de0b7250',
      },
    ],
  },
  {
    id: 4,
    transactionHash: '0x0ec3444e2036c94d3a1d2e757f7c7c982819ffc0167e37a98365e767293adbf5',
    tokenName: 'Chainlink',
    from: '0x18C4bf7c470069B9d18B6A5670E457De3983C299',
    to: '0x28C6c06298d514Db089934071355E5743bf21d60',
    info: 'this is the binance 14 account where they cash out',
    tokenAmount: 4871.6,
  },
];
export const chainLinkAttacks = [chainlinkTransactionFlow1, chainlinkTransactionFlow2, chainlinkTransactionFlow3, chainlinkTransactionFlow4]
