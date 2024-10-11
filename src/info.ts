import 'dotenv/config'; // Loads .env variables into process.env

const {
  ETHERSCAN_API_KEY, // Ethereum Mainnet API key
  ARBISCAN_API_KEY, // Arbitrum Mainnet API key
  POLYGONSCAN_API_KEY, // Polygon Mainnet API key
  GNOSISSCAN_API_KEY, // Gnosis Chain API key
  FTMSCAN_API_KEY, // Fantom Mainnet API key
  OPTIMISM_API_KEY, // Optimism Mainnet API key
} = process.env;
import { ChainId, ChainInfo } from './types';

interface UrlLink {
  url: string;
  description: string;
}
export type WalletType = 'Self-Custody' | 'CEX-Specific' | 'Other' | 'Mixer' | 'Unknown' | 'Victim';
export interface WalletInformation {
  alias: string;
  type: WalletType;
  chainIds: string[];
  urlLinks: UrlLink[];
  associatedAddresses: { [address: string]: { associatedTransactionHashes: string[] } };
}

export interface KnownWalletsMap {
  [address: string]: WalletInformation;
}

export const KnownWallets: KnownWalletsMap = {
  '0x18C4bf7c470069B9d18B6A5670E457De3983C299': {
    alias: 'Attacker_CD27_BinanceDepositWallet1',
    type: 'CEX-Specific',
    chainIds: ['1'],
    urlLinks: [],
    associatedAddresses: {},
  },
  '0x19F00b3a7B6F55C9dA966FE3723251784a797fa7': {
    alias: 'Attacker_CD27_BinanceDepositWallet2',
    type: 'CEX-Specific',
    chainIds: ['1'],
    urlLinks: [],
    associatedAddresses: {},
  },
  '0x28C6c06298d514Db089934071355E5743bf21d60': {
    alias: 'Binance 14',
    type: 'CEX-Specific',
    chainIds: ['1'],
    urlLinks: [],
    associatedAddresses: {},
  },
  '0xB38e8c17e38363aF6EbdCb3dAE12e0243582891D': {
    alias: 'Binance 54',
    type: 'CEX-Specific',
    chainIds: ['1'],
    urlLinks: [],
    associatedAddresses: {},
  },
  '0xD72CD83aFba0dCfEFf95D463adcB2b8dEf6aA623': {
    alias: 'Mixer1_CD27_',
    type: 'Mixer',
    chainIds: ['1'],
    urlLinks: [],
    associatedAddresses: {},
  },
  '0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43': {
    alias: 'Attacker_CD27_CoinBaseDeposit',
    type: 'CEX-Specific',
    chainIds: ['1'],
    urlLinks: [],
    associatedAddresses: {},
  },
  '0xa0277765726ae45667d84Ffd5b7f121477f200Da': {
    alias: 'Attacker_CD27_PersonalWallet',
    type: 'Self-Custody',
    chainIds: ['1'],
    urlLinks: [],
    associatedAddresses: {},
  },
  '0xD5b73fC035d4d679234323e0d891cAB4A4f5a1Ab': {
    alias: 'ChangeNow: Hot Wallet',
    type: 'CEX-Specific',
    chainIds: ['1'],
    urlLinks: [],
    associatedAddresses: {},
  },
  '0xEBf4FBB9C81b84dd5CF89BC75588E5d0018501b3': {
    alias: 'ftm mixer',
    type: 'Mixer',
    chainIds: ['250'],
    urlLinks: [],
    associatedAddresses: {},
  }, // FTM's chain ID is 250
};
export const WALLET_THAT_WAS_COMPROMISED = 'wallet that was compromised';

export const ATTACKED_WALLET_1 = '0xc24daD96e21a6cd97C263BF85B874e445469CD27';
export const ATTACKED_WALLET_2 = '0x74a4CEb40a6ced4a6b7028458C01cd4962e37B48';
export const ATTACKED_WALLET_3 = '0x8Ba3091b423aCd810954692293cb3C4E764B6001';
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
// const users: HackerProfile[] = [
//   {
//     rootAddress: '0x7f32dCCe8A0c41763Ee7bf208806723C3Ace0350',
//     ens: 'seanworkingdead.eth',
//     notes: '',
//     urlLinks: [{ description: 'twitter', url: 'https://mobile.x.com/seanworkingdead' }],
//     knownPlatforms: [],
//     associatedAccounts: [
//       {
//         address: '0xD72CD83aFba0dCfEFf95D463adcB2b8dEf6aA623',
//         type: 'tumbler',
//         transactionHashes: [{ description: '', transactionHashes: [] }],
//       },
//       {
//         address: '0xb5d85CBf7cB3EE0D56b3bB207D5Fc4B82f43F511',
//         type: 'CEX-Specific',
//         transactionHashes: [{ description: '', transactionHashes: [] }],
//       },
//     ],
//     associatedTransactionHash: [],
//   },
//   {
//     rootAddress: '',
//     ens: '',
//     notes: '',
//     urlLinks: [],
//     knownPlatforms: [],
//     associatedAccounts: [],
//     associatedTransactionHash: [],
//   },
// ];
const infuraKey = '23359d7bbef7404088daa7fbb1d256dd';
export const chainInfoMap: Map<ChainId, ChainInfo> = new Map([
  [
    ChainId.Ethereum, // Ethereum Mainnet
    {
      chainId: ChainId.Ethereum,
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/' + infuraKey,
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      blockExplorerUrl: 'https://etherscan.io',
      blockExplorerApiUrl: 'https://api.etherscan.io/api/', // Etherscan API URL for Ethereum
      apiKey: ETHERSCAN_API_KEY as string,
    },
  ],
  [
    ChainId.Arbitrum, // Arbitrum One Mainnet
    {

      chainId: ChainId.Arbitrum,
      name: 'Arbitrum One',
      rpcUrl: 'https://arbitrum-mainnet.infura.io/v3/' + infuraKey,
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      blockExplorerUrl: 'https://arbiscan.io',
      blockExplorerApiUrl: 'https://api.arbiscan.io/api', // Arbiscan API URL for Arbitrum
      apiKey: ARBISCAN_API_KEY as string,
    },
  ],
  [
    ChainId.Polygon, // Polygon Mainnet
    {

      chainId: ChainId.Polygon,
      name: 'Polygon Mainnet',

      rpcUrl: 'https://polygon-mainnet.infura.io/v3/' + infuraKey,
      nativeCurrency: {
        name: 'Matic',
        symbol: 'MATIC',
        decimals: 18,
      },
      blockExplorerUrl: 'https://polygonscan.com',
      blockExplorerApiUrl: 'https://api.polygonscan.com/api', // Polygonscan API URL for Polygon
      apiKey: POLYGONSCAN_API_KEY as string,
    },
  ],
  [
    ChainId.Gnosis, // Gnosis Chain (formerly xDai)
    {

      chainId: ChainId.Gnosis,
      name: 'Gnosis Chain (formerly xDai)',
      rpcUrl: 'https://rpc.gnosischain.com',
      nativeCurrency: {
        name: 'xDai',
        symbol: 'xDAI',
        decimals: 18,
      },
      blockExplorerUrl: 'https://gnosisscan.io',
      blockExplorerApiUrl: 'https://api.gnosisscan.io/api', // Gnosis Scan API URL for Gnosis Chain
      apiKey: GNOSISSCAN_API_KEY as string,
    },
  ],
  [
    ChainId.Fantom, // Fantom Opera Mainnet
    {

      chainId: ChainId.Fantom,
      name: 'Fantom Opera',
      rpcUrl: 'https://rpc.ftm.tools',
      nativeCurrency: {
        name: 'Fantom',
        symbol: 'FTM',
        decimals: 18,
      },
      blockExplorerUrl: 'https://ftmscan.com',
      blockExplorerApiUrl: 'https://api.ftmscan.com/api', // Ftmscan API URL for Fantom
      apiKey: FTMSCAN_API_KEY as string,
    },
  ],
  [
    ChainId.Optimism, // Optimism Mainnet
    {

      chainId: ChainId.Optimism,
      name: 'Optimism',
      rpcUrl: 'https://mainnet.optimism.io',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      blockExplorerUrl: 'https://optimistic.etherscan.io',
      blockExplorerApiUrl: 'https://api-optimistic.etherscan.io/api', // Optimism Etherscan API URL

      apiKey: OPTIMISM_API_KEY as string,
    },
  ],
]);
