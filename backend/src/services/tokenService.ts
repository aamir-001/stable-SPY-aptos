import { query } from "../db/database.js";

export async function getTokenBalance(
  tokenType: "stock" | "currency",
  tokenSymbol: string,
  userAddress: string
): Promise<number> {
  try {
    console.log(`[GET ${tokenSymbol} BALANCE] Fetching balance from database for ${userAddress}`);

    if (tokenType === "stock") {
      // Query portfolio_positions table for stock balance
      const result = await query(
        `SELECT current_quantity
         FROM portfolio_positions pp
         JOIN users u ON pp.user_id = u.id
         WHERE u.wallet_address = $1 AND pp.stock_symbol = $2`,
        [userAddress, tokenSymbol]
      );

      if (result.rows.length === 0) {
        console.log(`[GET ${tokenSymbol} BALANCE] No position found, returning 0`);
        return 0;
      }

      const balance = parseFloat(result.rows[0].current_quantity);
      console.log(`[GET ${tokenSymbol} BALANCE] Balance from DB: ${balance}`);
      return balance;

    } else if (tokenType === "currency") {
      // Query currency_balances table for currency balance
      const result = await query(
        `SELECT balance
         FROM currency_balances cb
         JOIN users u ON cb.user_id = u.id
         WHERE u.wallet_address = $1 AND cb.currency_symbol = $2`,
        [userAddress, tokenSymbol]
      );

      if (result.rows.length === 0) {
        console.log(`[GET ${tokenSymbol} BALANCE] No balance found, returning 0`);
        return 0;
      }

      const balance = parseFloat(result.rows[0].balance);
      console.log(`[GET ${tokenSymbol} BALANCE] Balance from DB: ${balance}`);
      return balance;

    } else {
      throw new Error(`Unknown token type: ${tokenType}`);
    }
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
