import { ethers } from 'ethers';
import { ChainInfo, TransactionContext } from '../types';
import {
  fetchTransactionForAddress as fetchTransactionsForAddress,
  TransactionDetails,
} from '../api/etherscan';
import {
  fetchTransaction,
  DecodedLogResult,
  getAddressInformation,
} from '../api/rpc';
import { fetchTokenCoinGeckoData, getTokenId } from '../api/coinGecko';
import { TokenPriceUSD } from '../dbCalls/coinGeckoData';

/**
 * Represents a transaction involving the native cryptocurrency (e.g., ETH, BNB).
 */
interface NativeTransaction {
  /** The hash of the transaction. */
  transactionHash: string;
  /** The address from which the transaction was sent. */
  from: string;
  /** The address to which the transaction was sent. */
  to: string;
  /** The raw value of the transaction as a string (in wei). */
  value: string;
  /** The formatted amount of the transaction using ethers.formatEther (in ether). */
  formattedAmount: string;
  /** The price of the token in USD at the time of the transaction. */
  tokenPriceUSD: TokenPriceUSD;
}

/**
 * Represents a transaction involving an ERC-20 token.
 */
interface TokenTransaction {
  /** The hash of the transaction. */
  transactionHash: string;
  /** The price of the token in USD at the time of the transaction. */
  tokenPriceUSD: TokenPriceUSD;
  /** The name of the token (optional if undefined). */
  tokenName?: string;
  /** The symbol of the token (optional if undefined). */
  tokenSymbol?: string;
  /** The contract address of the token. */
  tokenAddress: string;
  /** The address from which the transaction was sent. */
  from: string;
  /** The address to which the transaction was sent. */
  to: string;
  /** The raw value of the transaction as a string (in token units). */
  value: string;
  /** The formatted amount of the transaction. */
  formattedAmount: string;
  /** The decoded log result associated with the transaction (optional). */
  log?: DecodedLogResult;
}

/**
 * Represents the entry for a specific token's flow, detailing its transactions and balances.
 */
interface TokenFlowEntry {
  /** The total amount in USD that was received for this token. */
  inUSD: number;
  /** The total amount of tokens received. */
  in: number;
  /** The total amount in USD that was sent out for this token. */
  outUSD: number;
  /** The total amount of tokens sent out. */
  out: number;
  /** The name of the token. */
  tokenName: string;
  /** Array of transactions involving this token. */
  transactions: (TokenTransaction | NativeTransaction)[];
}

/**
 * Represents the flow of tokens for multiple token addresses.
 */
interface TokenFlow {
  /** Mapping of token addresses to their corresponding flow entries. */
  [tokenAddress: string]: TokenFlowEntry;
}

/**
 * Represents the context for all transactions associated with an address within a specified block range.
 */
interface AddressTransactionContext {
  /** Context for token transfers, organized by token address and transaction hash. */
  tokenTransferContext: { [tokenAddress: string]: { [hash: string]: TokenTransaction[] } };
  /** Array of native cryptocurrency transactions (e.g., ETH transfers). */
  nativeTransferContext: NativeTransaction[];
  /** Context for contract-based token transfers, organized by token address and transaction hash. */
  contractTransferContext: { [tokenAddress: string]: { [hash: string]: { contractLogs: TokenTransaction[], methodName: string } } };
  /** Array of nested contexts for child addresses (if applicable). */
  children: AddressTransactionContext[];
  /** Summary of the token flow for the address, including total in/out USD values and individual token flows. */
  tokenFlow: { inUSD: number, outUSD: number, tokenFlow: TokenFlow };
  /** The start block of the block range considered in this context. */
  startBlock: number;
  /** The end block of the block range considered in this context. */
  endBlock: number;
  /** The address this context pertains to. */
  address: string;
}

/**
 * Calculates the total in and out USD values for the token flow.
 */
const calculateTotals = (tokenFlow: TokenFlow) => {
  let inUSD = 0;
  let outUSD = 0;
  for (const key in tokenFlow) {
    if (tokenFlow.hasOwnProperty(key)) {
      inUSD += tokenFlow[key].inUSD;
      outUSD += tokenFlow[key].outUSD;
    }
  }
  return { inUSD, outUSD };
};

/**
 * Checks if the decoded log result represents a standard transfer event (ERC-20).
 * 
 * @param log - The decoded log result to check.
 * @returns An object containing `from`, `to`, and `value` if the log matches a transfer event; otherwise, `null`.
 */
const isTransfer = (log: DecodedLogResult) => {
  const [from, to] = log.topics;
  const value = log.data[0];
  const isValidTransfer = from?.name === 'from' && to?.name === 'to' && value.name === 'value';
  return isValidTransfer ? { from, to, value } : null;
};



/**
 * Initializes the token transfer context.
 */
const initializeTokenTransferContext = () => {
  return {} as { [key: string]: { [key: string]: TokenTransaction[] } };
};

/**
 * Initializes the contract transfer context.
 */
const initializeContractTransferContext = () => {
  return {} as { [key: string]: { [key: string]: { contractLogs: TokenTransaction[], methodName: string } } };
};

/**
 * Processes each transaction and updates the contexts accordingly.
 */
const processTransaction = async (
  info: TransactionContext,
  transaction: TransactionDetails,
  chain: ChainInfo,
  provider: ethers.JsonRpcProvider,
  nativeTransferContext: NativeTransaction[],
  tokenTransferContext: { [key: string]: { [key: string]: TokenTransaction[] } },
  contractTransferContext: { [key: string]: { [key: string]: { contractLogs: TokenTransaction[], methodName: string } } },
  address: string
) => {
  if (info.to.type === 'EOA') {
    await handleNativeTransaction(info, transaction, chain, nativeTransferContext);
  } else if (info.to.type === 'contract') {
    if (info.decodedMethod?.methodName === 'transfer') {
      await handleTokenTransfer(info, chain, tokenTransferContext);
    } else {
      await handleContractTransaction(info, provider, chain, contractTransferContext);
    }
  }
};

/**
 * Handles a native transaction and updates the native transfer context.
 */
const handleNativeTransaction = async (
  info: TransactionContext,
  transaction: TransactionDetails,
  chain: ChainInfo,
  nativeTransferContext: NativeTransaction[]
) => {
  const tokenApiId = await getTokenId(chain.nativeCurrency.symbol.toLowerCase());
  if (!tokenApiId) return;

  const tokenPrice = await fetchTokenCoinGeckoData(tokenApiId.id, chain);
  nativeTransferContext.push({
    tokenPriceUSD: {
      ...tokenPrice,
      AmountInUSD: Number(tokenPrice.usd) * Number(ethers.formatEther(transaction.value)),
    },
    transactionHash: transaction.hash,
    from: transaction.from,
    to: transaction.to,
    value: transaction.value,
    formattedAmount: ethers.formatEther(transaction.value),
  });
};

/**
 * Handles a token transfer transaction and updates the token transfer context.
 */
const handleTokenTransfer = async (
  info: TransactionContext,
  chain: ChainInfo,
  tokenTransferContext: { [key: string]: { [key: string]: TokenTransaction[] } }
) => {
  for (const d of info.decodedLogs?.decodedLogs ?? []) {
    const transfer = isTransfer(d);
    if (!transfer) continue;

    if (!tokenTransferContext[info.to.address]) {
      tokenTransferContext[info.to.address] = {};
    }

    if (!tokenTransferContext[info.to.address][d.transactionHash]) {
      tokenTransferContext[info.to.address][d.transactionHash] = [];
    }

    const tokenApiId = await getTokenId(info.to.tokenInfo?.symbol as string);
    if (!tokenApiId) continue;

    const tokenPrice = await fetchTokenCoinGeckoData(tokenApiId.id, chain);
    const formattedAmount = ethers.formatUnits(d.data[0].value, Number(info.to.tokenInfo?.decimals));
    tokenTransferContext[info.to.address][d.transactionHash].push({
      tokenPriceUSD: {
        ...tokenPrice,
        AmountInUSD: Number(tokenPrice.usd) * Number(formattedAmount),
      },
      transactionHash: d.transactionHash,
      tokenName: info.to.tokenInfo?.name,
      tokenSymbol: info.to.tokenInfo?.symbol,
      tokenAddress: info.to.address,
      from: d.topics[0].value,
      to: d.topics[1].value,
      value: d.data[0].value,
      formattedAmount,
      log: d,
    });
  }
};

/**
 * Handles contract transactions that are not simple transfers.
 */
const handleContractTransaction = async (
  info: any,
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
  contractTransferContext: { [key: string]: { [key: string]: { contractLogs: TokenTransaction[], methodName: string } } }
) => {
  if (!info.decodedLogs?.decodedLogs) return;

  const contractLogs = [];
  for (const l of info.decodedLogs.decodedLogs) {
    const transfer = isTransfer(l);
    if (!transfer) continue;

    const addressInfo = await getAddressInformation(l.address, provider);
    if (!addressInfo.tokenInfo?.symbol) continue;

    const tokenApiId = await getTokenId(addressInfo.tokenInfo?.symbol);
    if (!tokenApiId) continue;

    const tokenPrice = await fetchTokenCoinGeckoData(tokenApiId.id, chain);
    const formattedAmount = ethers.formatUnits(transfer.value.value, Number(addressInfo.tokenInfo?.decimals));
    contractLogs.push({
      log: l,
      tokenPriceUSD: {
        ...tokenPrice,
        AmountInUSD: Number(tokenPrice.usd) * Number(formattedAmount),
      },
      transactionHash: l.transactionHash,
      tokenName: addressInfo.tokenInfo?.name,
      tokenSymbol: addressInfo.tokenInfo?.symbol,
      tokenAddress: addressInfo.address,
      from: transfer.from.value,
      to: transfer.to.value,
      value: transfer.value.value,
      formattedAmount,
    });
  }

  if (!contractTransferContext[info.to.address]) {
    contractTransferContext[info.to.address] = {};
  }
  contractTransferContext[info.to.address][info.transactionHash] = { contractLogs, methodName: info.decodedMethod?.methodName as string };
};

/**
 * Builds the token flow context from native and token transfers.
 * 
 * @param nativeTransferContext - An array of native transactions (e.g., ETH transfers).
 * @param contractTransferContext - The contract-based token transfer context.
 * @param tokenTransferContext - The context for ERC-20 token transfers.
 * @param address - The address being analyzed.
 * @param chain - The blockchain chain information.
 * @returns A TokenFlow object summarizing the inflow and outflow of tokens.
 */
const buildTokenFlow = (
  nativeTransferContext: NativeTransaction[],
  contractTransferContext: { [key: string]: { [key: string]: { contractLogs: TokenTransaction[], methodName: string } } },
  tokenTransferContext: { [key: string]: { [key: string]: TokenTransaction[] } },
  address: string,
  chain: ChainInfo
): TokenFlow => {
  const tokenFlow: TokenFlow = {};

  // Process native currency transactions (e.g., ETH)
  for (const transfer of nativeTransferContext) {
    if (!tokenFlow['native']) {
      tokenFlow['native'] = {
        inUSD: 0,
        in: 0,
        outUSD: 0,
        out: 0,
        tokenName: chain.nativeCurrency.symbol,
        transactions: [],
      };
    }

    // Check if the transfer is incoming or outgoing
    if (transfer.to.toLowerCase() === address.toLowerCase()) {
      tokenFlow['native'].inUSD += transfer.tokenPriceUSD.AmountInUSD ?? 0;
      tokenFlow['native'].in += Number(transfer.formattedAmount);
    } else if (transfer.from.toLowerCase() === address.toLowerCase()) {
      tokenFlow['native'].outUSD += transfer.tokenPriceUSD.AmountInUSD ?? 0;
      tokenFlow['native'].out += Number(transfer.formattedAmount);
    }

    tokenFlow['native'].transactions.push(transfer);
  }

  // Process contract-based token transactions
  for (const contractAddress of Object.keys(contractTransferContext)) {
    for (const hash of Object.keys(contractTransferContext[contractAddress])) {
      for (const transfer of contractTransferContext[contractAddress][hash].contractLogs) {
        if (!tokenFlow[transfer.tokenAddress]) {
          tokenFlow[transfer.tokenAddress] = {
            inUSD: 0,
            in: 0,
            outUSD: 0,
            out: 0,
            tokenName: transfer.tokenName ?? '',
            transactions: [],
          };
        }

        if (transfer.to.toLowerCase() === address.toLowerCase()) {
          tokenFlow[transfer.tokenAddress].inUSD += transfer.tokenPriceUSD.AmountInUSD ?? 0;
          tokenFlow[transfer.tokenAddress].in += Number(transfer.formattedAmount);
        } else if (transfer.from.toLowerCase() === address.toLowerCase()) {
          tokenFlow[transfer.tokenAddress].outUSD += transfer.tokenPriceUSD.AmountInUSD ?? 0;
          tokenFlow[transfer.tokenAddress].out += Number(transfer.formattedAmount);
        }

        tokenFlow[transfer.tokenAddress].transactions.push(transfer);
      }
    }
  }

  // Process token transfers in the tokenTransferContext
  for (const tokenAddress of Object.keys(tokenTransferContext)) {
    for (const hash of Object.keys(tokenTransferContext[tokenAddress])) {
      for (const transfer of tokenTransferContext[tokenAddress][hash]) {
        if (!tokenFlow[tokenAddress]) {
          tokenFlow[tokenAddress] = {
            inUSD: 0,
            in: 0,
            outUSD: 0,
            out: 0,
            tokenName: transfer.tokenName ?? '',
            transactions: [],
          };
        }

        if (transfer.to.toLowerCase() === address.toLowerCase()) {
          tokenFlow[tokenAddress].inUSD += transfer.tokenPriceUSD.AmountInUSD ?? 0;
          tokenFlow[tokenAddress].in += Number(transfer.formattedAmount);
        } else if (transfer.from.toLowerCase() === address.toLowerCase()) {
          tokenFlow[tokenAddress].outUSD += transfer.tokenPriceUSD.AmountInUSD ?? 0;
          tokenFlow[tokenAddress].out += Number(transfer.formattedAmount);
        }

        tokenFlow[tokenAddress].transactions.push(transfer);
      }
    }
  }

  return tokenFlow;
};


/**
 * Fetches and processes all transactions for a given address in a specified block range.
 * 
 * This function builds a comprehensive summary of token movements (both native and token-based)
 * for the specified address within the given block range. The summary includes total incoming
 * and outgoing values for each token, as well as individual transactions grouped by token address.
 * 
 * The function processes:
 * - Native currency transfers (e.g., ETH) using the `nativeTransferContext`.
 * - Contract-based transfers, including ERC-20 tokens, using the `contractTransferContext`.
 * - Token transfers directly captured in the `tokenTransferContext`.
 * 
 * The aggregated information is used to build a `tokenFlow` object, showing how much value
 * was received and sent out in terms of both token quantities and their equivalent USD value.
 * 
 * @param {number} startBlock - The start block number.
 * @param {number} endBlock - The end block number.
 * @param {string} address - The address to fetch transactions for.
 * @param {ethers.JsonRpcProvider} provider - The JSON RPC provider.
 * @param {ChainInfo} chain - The blockchain chain information.
 * @returns {Promise<AddressTransactionContext>} A promise that resolves to an AddressTransactionContext object, containing
 * all transaction details, token flow, and the summary of incoming and outgoing USD values.
 */
export const fetchAddressContext = async (
  startBlock: number,
  endBlock: number,
  address: string,
  provider: ethers.JsonRpcProvider,
  chain: ChainInfo,
): Promise<AddressTransactionContext> => {
  const transactions = await fetchTransactionsForAddress(address, startBlock, endBlock, chain);
  const tokenTransferContext = initializeTokenTransferContext();
  const nativeTransferContext: NativeTransaction[] = [];
  const contractTransferContext = initializeContractTransferContext();

  for (const t of transactions) {
    const info = await fetchTransaction(t.hash, provider, chain);
    await processTransaction(info, t, chain, provider, nativeTransferContext, tokenTransferContext, contractTransferContext, address);
  }

  // Builds a comprehensive summary of token movements (native and token-based) for the given address
  const tokenFlow = buildTokenFlow(nativeTransferContext, contractTransferContext, tokenTransferContext, address, chain);

  // Calculates the total incoming and outgoing values in USD for all tokens and native currency combined.
  const { inUSD, outUSD } = calculateTotals(tokenFlow);

  // Constructs the final address context object, which includes all transaction details and the computed token flow.
  const addressContext: AddressTransactionContext = {
    tokenTransferContext,
    nativeTransferContext,
    contractTransferContext,
    tokenFlow: { inUSD, outUSD, tokenFlow },
    children: [],
    startBlock,
    endBlock,
    address,
  };

  return addressContext;
};
