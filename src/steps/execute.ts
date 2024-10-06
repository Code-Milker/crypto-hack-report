import { chainInfoMap } from '../info';
import { ChainId } from '../types';
import { createProvider, fetchBlockInfoFromTransaction, fetchTransactionDetails } from '../utils';
import { step0 } from './0_attackInformation';
import { step1 } from './1_fetchTokenTransaction';
import { step2 } from './2_fetchAttackPath';
import { step3 } from './3_fetchAttackWallet';
import { deleteDb } from './db';
// step0()
// step1('')
//
const run = async () => {
  await deleteDb(0)
  // await deleteDb(2)
  await deleteDb(3)
  await step0()
  // await step1()
  await step2();
  // await step3()
  // const res = await fetchBlockInfoFromTransaction('0x8875e20371a82b6be0a1c08399327d44602858ea1fa20d7a526a6c350a5ea51f', provider)
};
run();
// fetchTransactionDetails('0x35d924386dbee66d31d7f4faa75572965d39b834a4468cb7f797b749828976d5', provider).then(console.log)
