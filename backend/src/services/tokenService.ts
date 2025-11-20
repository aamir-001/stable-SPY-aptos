import { aptos } from "../aptosClient.js";

const STOCK_MODULES: Record<string, string> = {
  GOOG: "GOOGCoin",
  AAPL: "AAPLCoin",
  TSLA: "TSLACoin",
  NVDA: "NVDACoin",
  HOOD: "HOODCoin",
};

const CURRENCY_MODULES: Record<string, string> = {
  INR: "INRCoin",
  EUR: "EURCoin",
  CNY: "CNYCoin",
};

export async function getTokenBalance(
  tokenType: "stock" | "currency",
  tokenSymbol: string,
  userAddress: string
): Promise<number> {
  try {
    let moduleName: string | undefined;

    if (tokenType === "stock") {
      moduleName = STOCK_MODULES[tokenSymbol];
    } else if (tokenType === "currency") {
      moduleName = CURRENCY_MODULES[tokenSymbol];
    }

    if (!moduleName) {
      throw new Error(`Unknown ${tokenType}: ${tokenSymbol}`);
    }

    console.log(`[GET ${tokenSymbol} BALANCE] Fetching balance for ${userAddress}`);

    // Call the balance_of view function
    const result = await aptos.view({
      payload: {
        function: `${process.env.MY_ADDR}::${moduleName}::balance_of`,
        functionArguments: [userAddress],
      },
    });

    // The balance is returned in microunits (with 6 decimals)
    const balanceInMicrounits = Number(result[0]);
    const balance = balanceInMicrounits / 1_000_000;

    console.log(`[GET ${tokenSymbol} BALANCE] Balance: ${balance} (${balanceInMicrounits} microunits)`);

    return balance;
  } catch (error: any) {
    console.error(`[GET ${tokenSymbol} BALANCE] Error:`, error.message);
    throw new Error(`Failed to get ${tokenSymbol} balance: ${error.message}`);
  }
}

export async function getStockBalance(
  stock: string,
  userAddress: string
): Promise<number> {
  return getTokenBalance("stock", stock, userAddress);
}

export async function getCurrencyBalance(
  currency: string,
  userAddress: string
): Promise<number> {
  return getTokenBalance("currency", currency, userAddress);
}
