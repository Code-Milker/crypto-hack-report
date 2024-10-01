export const KnownWalletsMap = {
  '0x18C4bf7c470069B9d18B6A5670E457De3983C299': 'Attacker_CD27_BinanceDepositWallet1',
  '0x19F00b3a7B6F55C9dA966FE3723251784a797fa7': 'Attacker_CD27_BinanceDepositWallet2',
  '0x28C6c06298d514Db089934071355E5743bf21d60': 'Binance 14',
  '0xB38e8c17e38363aF6EbdCb3dAE12e0243582891D': 'Binance 54',
  '0xD72CD83aFba0dCfEFf95D463adcB2b8dEf6aA623': 'Mixer1_CD27_',
  '0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43': 'Attacker_CD27_CoinBaseDeposit',
  '0xa0277765726ae45667d84Ffd5b7f121477f200Da': 'Attacker_CD27_PersonalWallet',
  '0xD5b73fC035d4d679234323e0d891cAB4A4f5a1Ab': 'ChangeNow: Hot Wallet',
  '0xEBf4FBB9C81b84dd5CF89BC75588E5d0018501b3': 'ftm mixer',
};
export const ATTACKED_WALLET_1 = '0xc24daD96e21a6cd97C263BF85B874e445469CD27';
export const ATTACKED_WALLET_2 = '0x74a4CEb40a6ced4a6b7028458C01cd4962e37B48';
export const ATTACKED_WALLET_3 = '0x6dE4b8e197d55119595DfEF5D0F11E4eA2a184c8';
export const ATTACKED_WALLET_4 = '0xf80BA83d2a76E0a30C35FaC345EA26b295a4f63F';
// template
// {
//     rootAddress: '0x7f32dCCe8A0c41763Ee7bf208806723C3Ace0350',
//     ens: '',
//     notes: '',
//     urlLinks: [],
//     knownPlatforms: [],
//     associatedAccounts: [],
//     associatedTransactionHash: []
//
//   }
// template
// { address: '', type: '', transactionRootOfAttack: '', linkedTransactionHashWithRootAddress: '' }

// TODO create a list of users who cashed out to some centralized exchange
//TODO add associated accountants to this profile
const users: HackerProfile[] = [
  {
    rootAddress: '0x7f32dCCe8A0c41763Ee7bf208806723C3Ace0350',
    ens: 'seanworkingdead.eth',
    notes: '',
    urlLinks: [{ description: 'twitter', url: 'https://mobile.x.com/seanworkingdead' }],
    knownPlatforms: [],
    associatedAccounts: [
      {
        address: '0xD72CD83aFba0dCfEFf95D463adcB2b8dEf6aA623',
        type: 'tumbler',
        transactionHashes: [{ description: '', transactionHashes: [] }],
      },
      {
        address: '0xb5d85CBf7cB3EE0D56b3bB207D5Fc4B82f43F511',
        type: 'CEX-Specific',
        transactionHashes: [{ description: '', transactionHashes: [] }],
      },
    ],
    associatedTransactionHash: [],
  },
  {
    rootAddress: '',
    ens: '',
    notes: '',
    urlLinks: [],
    knownPlatforms: [],
    associatedAccounts: [],
    associatedTransactionHash: [],
  },
];

interface AssociatedAccount {
  address: string;
  type: 'DeFi-Specific' | 'CEX-Specific' | 'Other' | 'tumbler';
  transactionHashes: {
    description: string;
    transactionHashes: string[];
  }[];
}

interface UrlLink {
  url: string;
  description: string;
}

interface HackerProfile {
  ens: string;
  rootAddress: string;
  associatedTransactionHash: string[]; // Transactions where stolen funds were first deposited
  associatedAccounts: AssociatedAccount[]; // Array of associated accounts
  urlLinks: UrlLink[]; // Array of URLs related to the hacker's activity
  knownPlatforms: { description: string; address: string }[]; // List of known platforms the hacker interacts with
  notes: string; // Additional information or patterns about the hacker
}
