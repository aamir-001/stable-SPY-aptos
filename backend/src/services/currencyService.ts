import { aptos, signer } from "../aptosClient.js";
import { logMintTransaction } from "./portfolioService.js";

// Supported currencies
export type CurrencyType = "INR" | "EUR" | "CNY";

// Map currency tickers to their contract module names
const CURRENCY_MODULES: Record<CurrencyType, string> = {
  INR: "INRCoin",
  EUR: "EURCoin",
  CNY: "CNYCoin",
};

/**
 * Mint currency tokens to a user
 * @param currency - Currency ticker (INR, EUR, CNY)
 * @param userAddress - User's wallet address
 * @param amount - Amount in human-readable format (e.g., 1000 INR)
 */
export async function mintCurrency(
  currency: CurrencyType,
  userAddress: string,
  amount: number
) {
  try {
    if (!userAddress) {
      throw new Error("User address is required");
    }

    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const moduleName = CURRENCY_MODULES[currency];
    if (!moduleName) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    console.log(`[MINT ${currency}] Minting ${amount} ${currency} to ${userAddress}`);
    
    const scaledAmount = Math.floor(amount * 1_000_000);

    const txn = await aptos.transaction.build.simple({
      sender: signer.accountAddress,
      data: {
        function: `${process.env.MY_ADDR}::${moduleName}::mint_coins`,
        functionArguments: [userAddress, scaledAmount],
      },
    });

    const committed = await aptos.signAndSubmitTransaction({
      signer,
      transaction: txn,
    });

    await aptos.waitForTransaction({ transactionHash: committed.hash });

    console.log(`[MINT ${currency}] Success! TxHash: ${committed.hash}`);

    // Log transaction to database
    try {
      await logMintTransaction({
        walletAddress: userAddress,
        currencySymbol: currency,
        amount,
        baseCurrency: currency,
        txHash: committed.hash,
      });
    } catch (error) {
      console.error('Failed to log mint transaction to database:', error);
      // Don't fail the whole operation if DB logging fails
    }

    return {
      success: true,
      txHash: committed.hash,
      currency,
      amount,
      scaledAmount,
    };
  } catch (err: any) {
    console.error(`[MINT ${currency}] Error:`, err.message);
    throw new Error(`Failed to mint ${currency}: ${err.message}`);
  }
}

/**
 * Burn currency tokens from a user
 */
export async function burnCurrency(
  currency: CurrencyType,
  userAddress: string,
  amount: number
) {
  try {
    if (!userAddress) {
      throw new Error("User address is required");
    }

    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const moduleName = CURRENCY_MODULES[currency];
    if (!moduleName) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    console.log(`[BURN ${currency}] Burning ${amount} ${currency} from ${userAddress}`);
    
    const scaledAmount = Math.floor(amount * 1_000_000);

    const txn = await aptos.transaction.build.simple({
      sender: signer.accountAddress,
      data: {
        function: `${process.env.MY_ADDR}::${moduleName}::burn_coins`,
        functionArguments: [userAddress, scaledAmount],
      },
    });

    const committed = await aptos.signAndSubmitTransaction({
      signer,
      transaction: txn,
    });

    await aptos.waitForTransaction({ transactionHash: committed.hash });

    console.log(`[BURN ${currency}] Success! TxHash: ${committed.hash}`);

    return {
      success: true,
      txHash: committed.hash,
      currency,
      amount,
      scaledAmount,
    };
  } catch (err: any) {
    console.error(`[BURN ${currency}] Error:`, err.message);
    throw new Error(`Failed to burn ${currency}: ${err.message}`);
  }
}

/**
 * Get user's currency balance
 */
export async function getCurrencyBalance(
  currency: CurrencyType,
  userAddress: string
): Promise<number> {
  try {
    if (!userAddress) {
      throw new Error("User address is required");
    }

    const moduleName = CURRENCY_MODULES[currency];
    if (!moduleName) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    const balance = await aptos.view({
      payload: {
        function: `${process.env.MY_ADDR}::${moduleName}::balance_of`,
        functionArguments: [userAddress],
      },
    });

    const balanceValue = Number(balance[0]);
    return balanceValue / 1_000_000;
  } catch (err: any) {
    console.error(`[GET ${currency} BALANCE] Error:`, err.message);
    return 0;
  }
}

/**
 * Get all currency balances for a user
 */
export async function getAllBalances(userAddress: string) {
  const currencies: CurrencyType[] = ["INR", "EUR", "CNY"];
  const balances: Record<string, number> = {};

  for (const currency of currencies) {
    try {
      balances[currency] = await getCurrencyBalance(currency, userAddress);
    } catch (err) {
      balances[currency] = 0;
    }
  }

  return balances;
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): CurrencyType[] {
  return ["INR", "EUR", "CNY"];
}