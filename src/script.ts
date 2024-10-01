import attacksDataCd27 from '../input/0xc24daD96e21a6cd97C263BF85B874e445469CD27.json';
import { ATTACKED_WALLET_1 } from './info';
import { RawTransactionAttack, RawTransactionMetaData } from './types';
import { fetchTransaction } from './utils';
export const attacksOnEachChain: {
  transactions: RawTransactionAttack[];
  metaData: RawTransactionMetaData;
}[] = [
    {
      metaData: {
        chainId: '1',
        chain: 'Mainnet',
        wallet: ATTACKED_WALLET_1,
        rpcUrl: 'https://polygon-mainnet.infura.io/v3/5e6e5a11eb5f492792fb05057a80a602',
      },
      transactions: [
        {
          tokenSymbol: 'BTC',
          rootTransaction: '0x83db357ac4c7a1167052fcfbd59b9c116042b2dc5e005f1f1115b8c936531d52',
          transactionsPaths: [
            [
              '0x3eaf0bebdcba54c8b94dbba8f90dd81146679e81a0dc2b545d40c1dd69f0a95f',
              '0x4e6b7422fa8a22ceebacca90d22f7ae2e993d2daf36b87717590385301e4445e',
              '0x935c7b29e01c836f61d232e08d3deb1d094c1468ccf95a687b9dab7c890a2a04',
              '0x28c64239408a02b4957f972c9b1f359c06a93ff4945fe5bac8e946cac2c8f938',
            ],
            [
              '0x3eaf0bebdcba54c8b94dbba8f90dd81146679e81a0dc2b545d40c1dd69f0a95f',
              '0x4e6b7422fa8a22ceebacca90d22f7ae2e993d2daf36b87717590385301e4445e',
              '0x935c7b29e01c836f61d232e08d3deb1d094c1468ccf95a687b9dab7c890a2a04',
              '0xbbdd47fcd6b1f317d354b27ada2649848f81ac67e97d92db048489928df6caf1',
            ],
            [
              '0xaa178b10a3a37bab88fe5947950c314ebab98af1c5e4ef79a8f850bdf5a5a176',
              '0x3bf43a4089ef9b18263efe934b710b65c6d4d80f5635404e0c1485017c14ae39',
              '0x88ce75b97663bc338bd772ccaa4b3181d1630118b2e2e2e21a83a2528ab637cd',
            ],
            [
              '0xda19339d01d5e246a890e5349903ff5e4ef6feac598c6bcffdb75bd015ef65e9',
              '0x64c8cd9c5e3e1a68738547a297dd8a1f4dd8dc766481dea797b7a8c712754bcc',
              '0x88ce75b97663bc338bd772ccaa4b3181d1630118b2e2e2e21a83a2528ab637cd',
            ],
            [
              '0x47de66d544c22d7cc91e20038df268e9c37fab22eb415abf9fdc136d899e8c19',
              '0xf68149353dfd0c76501ae7dff7464bf8ba2216a3a5c304df3949653d94867cb3',
              '0x88ce75b97663bc338bd772ccaa4b3181d1630118b2e2e2e21a83a2528ab637cd',
            ],

            [
              '0x2d28428a9fb0a7603b075d5385e7322a030dc1d5f44bb408ed0c9685f3ebddf4',
              '0x20159aac308bc71d56a425257ef5125a2ad17891c24e779a361af5f492336477',
              '0x88ce75b97663bc338bd772ccaa4b3181d1630118b2e2e2e21a83a2528ab637cd',
            ],
            [
              '0x08f15059bbef61c311bbd30be01d76cff1e1637ee0b7baeb37a4b7d321597890',
              '0xac7e400a28859b35a6631c737a86ba50c04ed6599cc0e892aa279220ff6724eb',
              '0x0087dd6dcf4fa60465ade6e31db3e039ec65e260b2622af6985aee24b78fa81d',
            ],
            [
              '0xd59ea0d46ec944f9a3123b75a981773fc433a72f2afc259d1099c82754972368',
              '0x7f90d08d8306a54435dcc68c84606a985c286cdbf7d75f59b7a17bfdbb3145be',
              '0x8a48d354c5e42ff85678f956053d9b62a3391af57a4067d12dc34db8e5ab78a7',
            ],
            [
              '0xc5c8c707b1fd57494b56b738a95819690dd42fe798df9e8fc80494b4c428681c',
              '0xe2291f66f35b03e4ae9582f4b49aa661cb77e5a583fff5a520ffd547e51b1ded',
              '0x16c9c56b06ee7a45cbb5814d1aaeb551ab755378703ed7e4511b89cd1016e08f',
            ],
            [
              '0x90cf8c352c1517c5aaa3abf799b492e81a4adb5bb28d54cac2f3f57575336be7',
              '0xe58e16695db49fde976020c435229d4e41f3404be5780baefe143379f83ef372',
              '0x8a48d354c5e42ff85678f956053d9b62a3391af57a4067d12dc34db8e5ab78a7',
            ],
            [
              '0xf4130b8deb7d7f97162547dd96f2e2b0c906fd53c5c97c5abdac307caa95ad9e',
              '0x7a621986782fdc2ea7e6275aceae6b72dc074c496321a0641bd4da4005550acd',
              '0x8a48d354c5e42ff85678f956053d9b62a3391af57a4067d12dc34db8e5ab78a7',
            ],
            [
              '0x62daaf829021c507075369bd4464d0dcacdbe92e95ab32ef5155d83ee9f388a0',
              '0xc6a2363d697614557feb7bd611cff0ae58392e6bc934978d2446b7ddb13b406a',
              '0x16c9c56b06ee7a45cbb5814d1aaeb551ab755378703ed7e4511b89cd1016e08f',
            ],
          ],
        },
      ],
    },
  ];

attacksDataCd27.forEach((chain) => {
  chain.transactions.forEach(async (attack) => {
    await fetchTransaction({
      ...chain.metaData,
      ...attack,
    });
  });
});
//
