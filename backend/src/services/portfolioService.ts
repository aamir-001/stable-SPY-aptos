import { query } from '../db/database.js';

// Upsert user and get user ID using database function
export async function upsertUser(walletAddress: string, baseCurrency: string = 'INR'): Promise<string> {
  const result = await query(
    `SELECT upsert_user($1, $2) as id`,
    [walletAddress, baseCurrency]
  );
  return result.rows[0].id;
}

// Log a buy transaction (trigger automatically updates portfolio)
export async function logBuyTransaction(params: {
  walletAddress: string;
  stockSymbol: string;
  quantity: number;
  pricePerShare: number;
  totalValue: number;
  baseCurrency: string;
  txHash: string;
}) {
  try {
    // 1. Upsert user and get user_id
    const userId = await upsertUser(params.walletAddress, params.baseCurrency);

    // 2. Insert transaction (trigger automatically updates portfolio_positions)
    await query(
      `INSERT INTO transactions (
        user_id, transaction_type, stock_symbol,
        quantity, price_per_unit, total_value,
        tx_hash, status
      ) VALUES ($1, 'BUY', $2, $3, $4, $5, $6, 'SUCCESS')`,
      [
        userId,
        params.stockSymbol,
        params.quantity,
        params.pricePerShare,
        params.totalValue,
        params.txHash,
      ]
    );

    console.log(`✅ [DB] Logged BUY transaction: ${params.quantity} ${params.stockSymbol} @ ${params.pricePerShare} (trigger will update portfolio)`);
  } catch (error) {
    console.error('❌ [DB] Error logging buy transaction:', error);
    throw error;
  }
}

// Log a sell transaction (trigger automatically calculates P&L and updates portfolio)
export async function logSellTransaction(params: {
  walletAddress: string;
  stockSymbol: string;
  quantity: number;
  pricePerShare: number;
  totalValue: number;
  baseCurrency: string;
  txHash: string;
}) {
  try {
    // 1. Upsert user and get user_id
    const userId = await upsertUser(params.walletAddress, params.baseCurrency);

    // 2. Insert transaction (trigger automatically calculates realized_pnl and updates portfolio)
    await query(
      `INSERT INTO transactions (
        user_id, transaction_type, stock_symbol,
        quantity, price_per_unit, total_value,
        tx_hash, status
      ) VALUES ($1, 'SELL', $2, $3, $4, $5, $6, 'SUCCESS')`,
      [
        userId,
        params.stockSymbol,
        params.quantity,
        params.pricePerShare,
        params.totalValue,
        params.txHash,
      ]
    );

    console.log(`✅ [DB] Logged SELL transaction: ${params.quantity} ${params.stockSymbol} @ ${params.pricePerShare} (trigger will calculate P&L)`);
  } catch (error) {
    console.error('❌ [DB] Error logging sell transaction:', error);
    throw error;
  }
}

// Log mint transaction (trigger automatically updates currency_balances)
export async function logMintTransaction(params: {
  walletAddress: string;
  currencySymbol: string;
  amount: number;
  baseCurrency: string;
  txHash: string;
}) {
  try {
    // 1. Upsert user and get user_id
    const userId = await upsertUser(params.walletAddress, params.baseCurrency);

    // 2. Insert transaction (trigger automatically updates currency_balances)
    await query(
      `INSERT INTO transactions (
        user_id, transaction_type, currency_symbol,
        quantity, total_value, tx_hash, status
      ) VALUES ($1, 'MINT', $2, $3, $4, $5, 'SUCCESS')`,
      [
        userId,
        params.currencySymbol,
        params.amount,
        params.amount,
        params.txHash,
      ]
    );

    console.log(`✅ [DB] Logged MINT transaction: ${params.amount} ${params.currencySymbol} (trigger will update balance)`);
  } catch (error) {
    console.error('❌ [DB] Error logging mint transaction:', error);
    throw error;
  }
}

// Get portfolio overview for a user
export async function getPortfolioOverview(walletAddress: string) {
  const result = await query(
    `SELECT
      pp.stock_symbol,
      pp.current_quantity,
      pp.total_cost_basis,
      pp.average_cost_per_share,
      pp.realized_profit_loss,
      pp.last_updated,
      u.base_currency
     FROM portfolio_positions pp
     JOIN users u ON pp.user_id = u.id
     WHERE u.wallet_address = $1 AND pp.current_quantity > 0
     ORDER BY pp.stock_symbol`,
    [walletAddress]
  );

  return result.rows.map(row => ({
    stockSymbol: row.stock_symbol,
    currentQuantity: parseFloat(row.current_quantity),
    totalCostBasis: parseFloat(row.total_cost_basis),
    averageCostPerShare: parseFloat(row.average_cost_per_share),
    realizedProfitLoss: parseFloat(row.realized_profit_loss),
    baseCurrency: row.base_currency,
    lastUpdated: row.last_updated,
  }));
}

// Get detailed position for a specific stock
export async function getStockPosition(walletAddress: string, stockSymbol: string) {
  const positionResult = await query(
    `SELECT
      pp.stock_symbol,
      pp.current_quantity,
      pp.total_cost_basis,
      pp.average_cost_per_share,
      pp.realized_profit_loss,
      pp.last_updated,
      u.base_currency
     FROM portfolio_positions pp
     JOIN users u ON pp.user_id = u.id
     WHERE u.wallet_address = $1 AND pp.stock_symbol = $2`,
    [walletAddress, stockSymbol]
  );

  if (positionResult.rows.length === 0) {
    return null;
  }

  const position = positionResult.rows[0];

  // Get transaction history for this stock
  const transactionsResult = await query(
    `SELECT
      t.transaction_type,
      t.quantity,
      t.price_per_unit,
      t.total_value,
      t.realized_pnl,
      t.tx_hash,
      t.created_at
     FROM transactions t
     JOIN users u ON t.user_id = u.id
     WHERE u.wallet_address = $1 AND t.stock_symbol = $2
     ORDER BY t.created_at DESC`,
    [walletAddress, stockSymbol]
  );

  return {
    stockSymbol: position.stock_symbol,
    currentQuantity: parseFloat(position.current_quantity),
    totalCostBasis: parseFloat(position.total_cost_basis),
    averageCostPerShare: parseFloat(position.average_cost_per_share),
    realizedProfitLoss: parseFloat(position.realized_profit_loss),
    baseCurrency: position.base_currency,
    lastUpdated: position.last_updated,
    transactions: transactionsResult.rows.map(tx => ({
      type: tx.transaction_type,
      quantity: parseFloat(tx.quantity),
      pricePerShare: tx.price_per_unit ? parseFloat(tx.price_per_unit) : null,
      totalValue: parseFloat(tx.total_value),
      realizedPnl: tx.realized_pnl ? parseFloat(tx.realized_pnl) : null,
      txHash: tx.tx_hash,
      timestamp: tx.created_at,
    })),
  };
}

// Get all transactions for a user
export async function getUserTransactions(walletAddress: string, limit: number = 50) {
  const result = await query(
    `SELECT
      t.transaction_type,
      t.stock_symbol,
      t.currency_symbol,
      t.quantity,
      t.price_per_unit,
      t.total_value,
      t.realized_pnl,
      t.tx_hash,
      t.status,
      t.created_at,
      u.base_currency
     FROM transactions t
     JOIN users u ON t.user_id = u.id
     WHERE u.wallet_address = $1
     ORDER BY t.created_at DESC
     LIMIT $2`,
    [walletAddress, limit]
  );

  return result.rows.map(tx => ({
    type: tx.transaction_type,
    stockSymbol: tx.stock_symbol,
    currencySymbol: tx.currency_symbol,
    quantity: parseFloat(tx.quantity),
    pricePerShare: tx.price_per_unit ? parseFloat(tx.price_per_unit) : null,
    totalValue: parseFloat(tx.total_value),
    realizedPnl: tx.realized_pnl ? parseFloat(tx.realized_pnl) : null,
    baseCurrency: tx.base_currency,
    txHash: tx.tx_hash,
    status: tx.status,
    timestamp: tx.created_at,
  }));
}

// Get user info (including base currency)
export async function getUserInfo(walletAddress: string) {
  const result = await query(
    `SELECT
      id,
      wallet_address,
      base_currency,
      created_at,
      updated_at
     FROM users
     WHERE wallet_address = $1`,
    [walletAddress]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  return {
    id: user.id,
    walletAddress: user.wallet_address,
    baseCurrency: user.base_currency,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
