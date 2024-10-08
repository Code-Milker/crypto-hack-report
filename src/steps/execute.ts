import { ethers } from 'ethers';
import { chainInfoMap } from '../info';
import { ChainId, ChainInfo } from '../types';
import { generateAttackReport, step1 } from './1_fetchTokenTransaction';
// step0()
// step1('')
//
const run = async () => {
  const chain: ChainInfo = chainInfoMap.get(ChainId.Fantom) as ChainInfo;
  console.log(chain)
  const report = await generateAttackReport(
    '0xcee4da0e7bdbb3112b2cd249b459d92c1afc23047db545c33ee60532773736d9',
    new ethers.JsonRpcProvider(chain.rpcUrl),
    chain,
  );
  console.log(JSON.stringify(report, null, 2))
  // await deleteDb(0)
  // // await deleteDb(2)
  // await deleteDb(3)
  // await step0()
  // // await step1()
  // await step2();
  // await step3()
  // const res = await fetchBlockInfoFromTransaction('0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f', provider)
};
run();
// fetchTransactionDetails('0x35d924386dbee66d31d7f4faa75572965d39b834a4468cb7f797b749828976d5', provider).then(console.log)
