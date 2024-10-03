import { chainInfoMap } from "../info";
import { ChainId } from "../types";
import { createProvider, fetchTransactionDetails } from "../utils";
import { step0 } from "./0_attackInformation";
import { step1 } from "./1_fetchTokenTransaction";
import { step2 } from "./2_fetchAttackPath";
import { step3 } from "./3_fetchAttackWallet";
// step1('0x35d924386dbee66d31d7f4faa75572965d39b834a4468cb7f797b749828976d5')
step2()
// const provider = createProvider(chainInfoMap.get(ChainId.Ethereum)?.rpcUrl as string)
// fetchTransactionDetails('0x35d924386dbee66d31d7f4faa75572965d39b834a4468cb7f797b749828976d5', provider).then(console.log)
