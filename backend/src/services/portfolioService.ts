import { query, getClient } from '../db/database.js';

// Upsert user and get user ID
export async function upsertUser(walletAddress: string, baseCurrency: string = 'INR'): Promise<string> {
  const result = await query(
    `INSERT INTO users (wallet_address, base_currency)
     VALUES ($1, $2)
     ON CONFLICT (wallet_address)
     DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING id`,
    [walletAddress, baseCurrency]
  );
  return result.rows[0].id;
}

// Log a buy transaction and update portfolio position
export async function logBuyTransaction(params: {
  walletAddress: string;
  stockSymbol: string;
  quantity: number;
  pricePerShare: number;
  totalValue: number;
  baseCurrency: string;
  txHash: string;
}) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Upsert user
    const userResult = await client.query(
      `INSERT INTO users (wallet_address, base_currency)
       VALUES ($1, $2)
       ON CONFLICT (wallet_address)
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [params.walletAddress, params.baseCurrency]
    );
    const userId = userResult.rows[0].id;

    // 2. Insert transaction record
    await client.query(
      `INSERT INTO transactions (
        user_id, wallet_address, transaction_type, stock_symbol,
        quantity, price_per_share, total_value, realized_pnl,
        base_currency, tx_hash, status
      ) VALUES ($1, $2, 'BUY', $3, $4, $5, $6, NULL, $7, $8, 'SUCCESS')`,
      [
        userId,
        params.walletAddress,
        params.stockSymbol,
        params.quantity,
        params.pricePerShare,
        params.totalValue,
        params.baseCurrency,
        params.txHash,
      ]
    );

    // 3. Update portfolio position (upsert)
    await client.query(
      `INSERT INTO portfolio_positions (
        user_id, wallet_address, stock_symbol,
        current_quantity, total_cost_basis, average_cost_per_share,
        realized_profit_loss, base_currency
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
      ON CONFLICT (wallet_address, stock_symbol)
      DO UPDATE SET
        current_quantity = portfolio_positions.current_quantity + $4,
        total_cost_basis = portfolio_positions.total_cost_basis + $5,
        average_cost_per_share = (portfolio_positions.total_cost_basis + $5) / (portfolio_positions.current_quantity + $4),
        last_updated = CURRENT_TIMESTAMP`,
      [
        userId,
        params.walletAddress,
        params.stockSymbol,
        params.quantity,
        params.totalValue,
        params.pricePerShare,
        params.baseCurrency,
      ]
    );

    await client.query('COMMIT');
    console.log(`✅ [DB] Logged BUY transaction: ${params.quantity} ${params.stockSymbol} @ ${params.pricePerShare}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [DB] Error logging buy transaction:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Log a sell transaction and update portfolio position
export async function logSellTransaction(params: {
  walletAddress: string;
  stockSymbol: string;
  quantity: number;
  pricePerShare: number;
  totalValue: number;
  baseCurrency: string;
  txHash: string;
}) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Upsert user
    const userResult = await client.query(
      `INSERT INTO users (wallet_address, base_currency)
       VALUES ($1, $2)
       ON CONFLICT (wallet_address)
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [params.walletAddress, params.baseCurrency]
    );
    const userId = userResult.rows[0].id;

    // 2. Get current portfolio position to calculate realized P&L
    const positionResult = await client.query(
      `SELECT current_quantity, total_cost_basis, average_cost_per_share
       FROM portfolio_positions
       WHERE wallet_address = $1 AND stock_symbol = $2`,
      [params.walletAddress, params.stockSymbol]
    );

    if (positionResult.rows.length === 0) {
      throw new Error(`No position found for ${params.stockSymbol}`);
    }

    const position = positionResult.rows[0];
    const averageCost = parseFloat(position.average_cost_per_share);
    const costOfSoldShares = params.quantity * averageCost;
    const realizedPnl = params.totalValue - costOfSoldShares;

    // 3. Insert transaction record with realized P&L
    await client.query(
      `INSERT INTO transactions (
        user_id, wallet_address, transaction_type, stock_symbol,
        quantity, price_per_share, total_value, realized_pnl,
        base_currency, tx_hash, status
      ) VALUES ($1, $2, 'SELL', $3, $4, $5, $6, $7, $8, $9, 'SUCCESS')`,
      [
        userId,
        params.walletAddress,
        params.stockSymbol,
        params.quantity,
        params.pricePerShare,
        params.totalValue,
        realizedPnl,
        params.baseCurrency,
        params.txHash,
      ]
    );

    // 4. Update portfolio position
    await client.query(
      `UPDATE portfolio_positions SET
        current_quantity = current_quantity - $1,
        total_cost_basis = total_cost_basis - $2,
        realized_profit_loss = realized_profit_loss + $3,
        last_updated = CURRENT_TIMESTAMP
       WHERE wallet_address = $4 AND stock_symbol = $5`,
      [params.quantity, costOfSoldShares, realizedPnl, params.walletAddress, params.stockSymbol]
    );

    await client.query('COMMIT');
    console.log(`✅ [DB] Logged SELL transaction: ${params.quantity} ${params.stockSymbol} @ ${params.pricePerShare} (P&L: ${realizedPnl >= 0 ? '+' : ''}${realizedPnl.toFixed(2)})`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [DB] Error logging sell transaction:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Log mint transaction
export async function logMintTransaction(params: {
  walletAddress: string;
  currencySymbol: string;
  amount: number;
  baseCurrency: string;
  txHash: string;
}) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Upsert user
    const userResult = await client.query(
      `INSERT INTO users (wallet_address, base_currency)
       VALUES ($1, $2)
       ON CONFLICT (wallet_address)
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [params.walletAddress, params.baseCurrency]
    );
    const userId = userResult.rows[0].id;

    // Insert mint transaction
    await client.query(
      `INSERT INTO transactions (
        user_id, wallet_address, transaction_type, currency_symbol,
        quantity, price_per_share, total_value, realized_pnl,
        base_currency, tx_hash, status
      ) VALUES ($1, $2, 'MINT', $3, $4, NULL, $5, NULL, $6, $7, 'SUCCESS')`,
      [
        userId,
        params.walletAddress,
        params.currencySymbol,
        params.amount,
        params.amount,
        params.baseCurrency,
        params.txHash,
      ]
    );

    await client.query('COMMIT');
    console.log(`✅ [DB] Logged MINT transaction: ${params.amount} ${params.currencySymbol}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [DB] Error logging mint transaction:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get portfolio overview for a user
export async function getPortfolioOverview(walletAddress: string) {
  const result = await query(
    `SELECT
      stock_symbol,
      current_quantity,
      total_cost_basis,
      average_cost_per_share,
      realized_profit_loss,
      base_currency,
      last_updated
     FROM portfolio_positions
     WHERE wallet_address = $1 AND current_quantity > 0
     ORDER BY stock_symbol`,
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
      stock_symbol,
      current_quantity,
      total_cost_basis,
      average_cost_per_share,
      realized_profit_loss,
      base_currency,
      last_updated
     FROM portfolio_positions
     WHERE wallet_address = $1 AND stock_symbol = $2`,
    [walletAddress, stockSymbol]
  );

  if (positionResult.rows.length === 0) {
    return null;
  }

  const position = positionResult.rows[0];

  // Get transaction history for this stock
  const transactionsResult = await query(
    `SELECT
      transaction_type,
      quantity,
      price_per_share,
      total_value,
      realized_pnl,
      tx_hash,
      created_at
     FROM transactions
     WHERE wallet_address = $1 AND stock_symbol = $2
     ORDER BY created_at DESC`,
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
      pricePerShare: tx.price_per_share ? parseFloat(tx.price_per_share) : null,
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
      transaction_type,
      stock_symbol,
      currency_symbol,
      quantity,
      price_per_share,
      total_value,
      realized_pnl,
      base_currency,
      tx_hash,
      status,
      created_at
     FROM transactions
     WHERE wallet_address = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [walletAddress, limit]
  );

  return result.rows.map(tx => ({
    type: tx.transaction_type,
    stockSymbol: tx.stock_symbol,
    currencySymbol: tx.currency_symbol,
    quantity: parseFloat(tx.quantity),
    pricePerShare: tx.price_per_share ? parseFloat(tx.price_per_share) : null,
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
