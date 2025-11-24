import { aptos, signer } from "../aptosClient.js";
import { query } from "../db/database.js";
import Decimal from 'decimal.js';

// USDC testnet address
const USDC_ADDRESS = "0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832";

// Hardcoded private market token prices in USDC (with 6 decimals like USDC)
// Prices are between 0.1 and 0.5 USDC per token
const PRIVATE_STOCK_PRICES: Record<string, number> = {
  STRIPE: 0.45,      // $0.45 USDC per token
  OPENAI: 0.50,      // $0.50 USDC per token
  DATABRICKS: 0.35,  // $0.35 USDC per token
  SPACEX: 0.40,      // $0.40 USDC per token
};

// Token metadata addresses (from deployed contracts)
const PRIVATE_TOKEN_METADATA: Record<string, string> = {
  STRIPE: "0x170c9f3755176f50cb75f54136d0463115d56ca2a68902b753e4872e3fa0ffd5",
  OPENAI: "0x44ab397cdf0afea29ecf455db3eb743df2e3b86b133a439227adb4d908ec31b",
  DATABRICKS: "0xb901128c17a14c2a311ed36417882cb05fe98410997c5a7123171a70174e5b47",
  SPACEX: "0xed97f0ede804ba717328d4f3b830cdcf5d089474b410345b0671219455e6e593",
};

// Contract module names
const PRIVATE_TOKEN_MODULES: Record<string, string> = {
  STRIPE: "STRIPECoin",
  OPENAI: "OPENAICoin",
  DATABRICKS: "DATABRICKSCoin",
  SPACEX: "SPACEXCoin",
};

const MY_ADDR = process.env.MY_ADDR || "0xebb91a4b81d7df2f2994095f2c6242096bbd4c18d78df312de70ddb8f25779a9";
const ADMIN_FEE_WALLET = process.env.ADMIN_FEE_WALLET;
const FEE_PERCENTAGE = parseFloat(process.env.FEE_PERCENTAGE || '0.001');

export function getPrivateStockPrice(symbol: string): number {
  const price = PRIVATE_STOCK_PRICES[symbol.toUpperCase()];
  if (!price) {
    throw new Error(`Unknown private stock symbol: ${symbol}`);
  }
  return price;
}

export function getAllPrivateStocks() {
  return Object.entries(PRIVATE_STOCK_PRICES).map(([symbol, price]) => ({
    symbol,
    price,
    metadata: PRIVATE_TOKEN_METADATA[symbol],
    module: PRIVATE_TOKEN_MODULES[symbol],
  }));
}

export async function getPrivateStockBalance(userAddress: string, symbol: string): Promise<number> {
  const upperSymbol = symbol.toUpperCase();
  const moduleName = PRIVATE_TOKEN_MODULES[upperSymbol];

  if (!moduleName) {
    throw new Error(`Unknown private stock symbol: ${symbol}`);
  }

  try {
    const result = await aptos.view({
      payload: {
        function: `${MY_ADDR}::${moduleName}::balance_of`,
        functionArguments: [userAddress],
      },
    });
    return Number(result[0]) / 1_000_000;
  } catch (error) {
    return 0;
  }
}

// Get USDC balance
async function getUSDCBalance(userAddress: string): Promise<number> {
  try {
    // Use the balance function directly with metadata object
    const balanceResult = await aptos.view({
      payload: {
        function: `0x1::primary_fungible_store::balance`,
        typeArguments: [`0x1::fungible_asset::Metadata`],
        functionArguments: [userAddress, USDC_ADDRESS],
      },
    });

    const balance = Number(balanceResult[0]) / 1_000_000; // USDC has 6 decimals
    console.log(`[USDC BALANCE CHECK] User: ${userAddress}, Balance: $${balance.toFixed(4)} USDC`);
    return balance;
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return 0;
  }
}

export async function buyPrivateStockService(
  userAddress: string,
  stock: string,
  usdcAmount: number
) {
  const upperStock = stock.toUpperCase();
  const pricePerToken = getPrivateStockPrice(upperStock);
  const moduleName = PRIVATE_TOKEN_MODULES[upperStock];

  if (!moduleName) {
    throw new Error(`Unknown private stock: ${stock}`);
  }

  if (!ADMIN_FEE_WALLET) {
    throw new Error('ADMIN_FEE_WALLET not configured');
  }

  // Calculate tokens to buy
  // USDC has 6 decimals, our tokens have 6 decimals
  const usdcAmountScaled = new Decimal(usdcAmount).times(1_000_000);
  const priceScaled = new Decimal(pricePerToken).times(1_000_000);

  // Calculate with fee
  const priceWithFee = new Decimal(pricePerToken).times(1 + FEE_PERCENTAGE);
  const tokensToMint = usdcAmountScaled.dividedBy(priceWithFee.times(1_000_000)).floor().toNumber();

  if (tokensToMint < 1) {
    const minPrice = new Decimal(pricePerToken).times(1 + FEE_PERCENTAGE).toFixed(4);
    throw new Error(
      `USDC amount too low. Need at least $${minPrice} USDC to buy 1 ${upperStock} token (including 0.1% fee). ` +
      `You provided $${new Decimal(usdcAmount).toFixed(4)}.`
    );
  }

  // Calculate exact amounts
  const actualTokenValue = new Decimal(tokensToMint).times(priceScaled).toNumber();
  const feeAmountScaled = new Decimal(actualTokenValue).times(FEE_PERCENTAGE).floor().toNumber();
  const totalUsdcNeeded = actualTokenValue + feeAmountScaled;
  const totalUsdcNeededInUsdc = new Decimal(totalUsdcNeeded).dividedBy(1_000_000).toNumber();

  // Check USDC balance
  const usdcBalance = await getUSDCBalance(userAddress);
  if (usdcBalance < totalUsdcNeededInUsdc) {
    throw new Error(
      `Insufficient USDC balance. You have $${usdcBalance.toFixed(4)} USDC but need $${totalUsdcNeededInUsdc.toFixed(4)} USDC (including 0.1% fee).`
    );
  }

  console.log("[PRIVATE BUY] Stock:", upperStock);
  console.log("[PRIVATE BUY] Price per token: $", pricePerToken);
  console.log("[PRIVATE BUY] USDC provided: $", usdcAmount);
  console.log("[PRIVATE BUY] User USDC balance: $", usdcBalance.toFixed(4));
  console.log("[PRIVATE BUY] Tokens to transfer:", tokensToMint);
  console.log("[PRIVATE BUY] Token value: $", new Decimal(actualTokenValue).dividedBy(1_000_000).toFixed(4));
  console.log("[PRIVATE BUY] Fee (0.1%): $", new Decimal(feeAmountScaled).dividedBy(1_000_000).toFixed(4));
  console.log("[PRIVATE BUY] Total USDC needed: $", totalUsdcNeededInUsdc.toFixed(4));

  // Check if admin has enough stock tokens
  const adminBalance = await getPrivateStockBalance(signer.accountAddress.toString(), upperStock);
  if (adminBalance < tokensToMint) {
    throw new Error(
      `Insufficient admin stock balance. Admin has ${adminBalance} ${upperStock} but needs ${tokensToMint}.`
    );
  }

  // Transfer stock tokens from admin to user (using transfer_coins function)
  const tokensToTransferScaled = tokensToMint * 1_000_000;

  const transferStockTxn = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function: `${MY_ADDR}::${moduleName}::transfer_coins`,
      functionArguments: [
        signer.accountAddress.toString(), // from (admin)
        userAddress,                       // to (user)
        tokensToTransferScaled            // amount
      ],
    },
  });

  const transferStockCommitted = await aptos.signAndSubmitTransaction({
    signer,
    transaction: transferStockTxn,
  });

  console.log("[PRIVATE BUY] Stock transfer tx:", transferStockCommitted.hash);
  await aptos.waitForTransaction({ transactionHash: transferStockCommitted.hash });
  console.log("[PRIVATE BUY] Stock tokens transferred successfully");

  // Log to database
  const pricePerShare = pricePerToken;
  const totalValue = new Decimal(actualTokenValue).dividedBy(1_000_000).toNumber();
  const feeAmount = new Decimal(feeAmountScaled).dividedBy(1_000_000).toNumber();

  try {
    await logPrivateBuyTransaction({
      walletAddress: userAddress,
      stockSymbol: upperStock,
      quantity: tokensToMint,
      pricePerShare,
      totalValue,
      feeAmount,
      tokenTxHash: transferStockCommitted.hash,
    });
  } catch (error) {
    console.error('Failed to log private buy transaction to database:', error);
  }

  return {
    success: true,
    txHash: transferStockCommitted.hash,
    tokenAmount: tokensToMint,
    pricePerToken: pricePerToken,
    totalSpent: totalValue,
    feeAmount: feeAmount,
    totalDeducted: new Decimal(totalUsdcNeeded).dividedBy(1_000_000).toNumber(),
    change: new Decimal(usdcAmount).minus(new Decimal(totalUsdcNeeded).dividedBy(1_000_000)).toNumber(),
  };
}

export async function sellPrivateStockService(
  userAddress: string,
  stock: string,
  tokenAmount: number
) {
  const upperStock = stock.toUpperCase();
  const pricePerToken = getPrivateStockPrice(upperStock);
  const moduleName = PRIVATE_TOKEN_MODULES[upperStock];

  if (!moduleName) {
    throw new Error(`Unknown private stock: ${stock}`);
  }

  if (!ADMIN_FEE_WALLET) {
    throw new Error('ADMIN_FEE_WALLET not configured');
  }

  if (tokenAmount <= 0) {
    throw new Error("Token amount must be greater than 0");
  }

  // Calculate USDC to return
  const priceScaled = new Decimal(pricePerToken).times(1_000_000);
  const tokenAmountScaled = new Decimal(tokenAmount).times(1_000_000).floor().toNumber();
  const grossUsdcScaled = new Decimal(tokenAmountScaled).times(priceScaled).dividedBy(1_000_000).floor().toNumber();
  const feeAmountScaled = new Decimal(grossUsdcScaled).times(FEE_PERCENTAGE).floor().toNumber();
  const netUsdcScaled = grossUsdcScaled - feeAmountScaled;

  console.log("[PRIVATE SELL] Stock:", upperStock);
  console.log("[PRIVATE SELL] Price per token: $", pricePerToken);
  console.log("[PRIVATE SELL] Tokens to sell:", tokenAmount);
  console.log("[PRIVATE SELL] Gross USDC: $", new Decimal(grossUsdcScaled).dividedBy(1_000_000).toFixed(4));
  console.log("[PRIVATE SELL] Fee (0.1%): $", new Decimal(feeAmountScaled).dividedBy(1_000_000).toFixed(4));
  console.log("[PRIVATE SELL] Net USDC: $", new Decimal(netUsdcScaled).dividedBy(1_000_000).toFixed(4));

  // Burn tokens from user
  const burnTxn = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function: `${MY_ADDR}::${moduleName}::burn_coins`,
      functionArguments: [userAddress, tokenAmountScaled],
    },
  });

  const burnCommitted = await aptos.signAndSubmitTransaction({
    signer,
    transaction: burnTxn,
  });

  await aptos.waitForTransaction({ transactionHash: burnCommitted.hash });

  // Log to database
  const pricePerShare = pricePerToken;
  const totalValue = new Decimal(grossUsdcScaled).dividedBy(1_000_000).toNumber();
  const feeAmount = new Decimal(feeAmountScaled).dividedBy(1_000_000).toNumber();
  const netReceived = new Decimal(netUsdcScaled).dividedBy(1_000_000).toNumber();

  try {
    await logPrivateSellTransaction({
      walletAddress: userAddress,
      stockSymbol: upperStock,
      quantity: tokenAmount,
      pricePerShare,
      totalValue,
      feeAmount,
      tokenTxHash: burnCommitted.hash,
    });
  } catch (error) {
    console.error('Failed to log private sell transaction to database:', error);
  }

  return {
    success: true,
    txHash: burnCommitted.hash,
    tokensSold: tokenAmount,
    pricePerToken: pricePerToken,
    grossAmount: totalValue,
    feeAmount: feeAmount,
    netReceived: netReceived,
  };
}

// Database logging functions
async function logPrivateBuyTransaction(params: {
  walletAddress: string;
  stockSymbol: string;
  quantity: number;
  pricePerShare: number;
  totalValue: number;
  feeAmount: number;
  tokenTxHash: string;
}) {
  try {
    // Get or create user
    const userResult = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [params.walletAddress]
    );

    let userId: number;
    if (userResult.rows.length === 0) {
      const insertResult = await query(
        'INSERT INTO users (wallet_address, base_currency) VALUES ($1, $2) RETURNING id',
        [params.walletAddress, 'USDC']
      );
      userId = insertResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Log transaction
    await query(
      `INSERT INTO private_market_transactions
       (user_id, stock_symbol, transaction_type, quantity, price_per_share, total_value, fee_amount, token_tx_hash, status)
       VALUES ($1, $2, 'BUY', $3, $4, $5, $6, $7, 'SUCCESS')`,
      [userId, params.stockSymbol, params.quantity, params.pricePerShare, params.totalValue, params.feeAmount, params.tokenTxHash]
    );
  } catch (error) {
    console.error('Error logging private buy transaction:', error);
    throw error;
  }
}

async function logPrivateSellTransaction(params: {
  walletAddress: string;
  stockSymbol: string;
  quantity: number;
  pricePerShare: number;
  totalValue: number;
  feeAmount: number;
  tokenTxHash: string;
}) {
  try {
    // Get user
    const userResult = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [params.walletAddress]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userId = userResult.rows[0].id;

    // Log transaction
    await query(
      `INSERT INTO private_market_transactions
       (user_id, stock_symbol, transaction_type, quantity, price_per_share, total_value, fee_amount, token_tx_hash, status)
       VALUES ($1, $2, 'SELL', $3, $4, $5, $6, $7, 'SUCCESS')`,
      [userId, params.stockSymbol, params.quantity, params.pricePerShare, params.totalValue, params.feeAmount, params.tokenTxHash]
    );
  } catch (error) {
    console.error('Error logging private sell transaction:', error);
    throw error;
  }
}

export async function getPrivatePortfolio(walletAddress: string) {
  try {
    const userResult = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (userResult.rows.length === 0) {
      return [];
    }

    const userId = userResult.rows[0].id;

    const result = await query(
      `SELECT stock_symbol, current_quantity, total_cost_basis, average_cost_per_share, realized_profit_loss
       FROM private_market_portfolio
       WHERE user_id = $1 AND current_quantity > 0`,
      [userId]
    );

    return result.rows.map(row => ({
      symbol: row.stock_symbol,
      quantity: parseFloat(row.current_quantity),
      totalCostBasis: parseFloat(row.total_cost_basis),
      averageCost: parseFloat(row.average_cost_per_share),
      realizedPnL: parseFloat(row.realized_profit_loss),
      currentPrice: PRIVATE_STOCK_PRICES[row.stock_symbol] || 0,
      currentValue: parseFloat(row.current_quantity) * (PRIVATE_STOCK_PRICES[row.stock_symbol] || 0),
    }));
  } catch (error) {
    console.error('Error getting private portfolio:', error);
    return [];
  }
}

export async function getPrivateTransactions(walletAddress: string) {
  try {
    const userResult = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (userResult.rows.length === 0) {
      return [];
    }

    const userId = userResult.rows[0].id;

    const result = await query(
      `SELECT stock_symbol, transaction_type, quantity, price_per_share, total_value, fee_amount, realized_pnl, token_tx_hash, created_at
       FROM private_market_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    return result.rows.map(row => ({
      symbol: row.stock_symbol,
      type: row.transaction_type,
      quantity: parseFloat(row.quantity),
      pricePerShare: parseFloat(row.price_per_share),
      totalValue: parseFloat(row.total_value),
      feeAmount: parseFloat(row.fee_amount),
      realizedPnL: row.realized_pnl ? parseFloat(row.realized_pnl) : null,
      txHash: row.token_tx_hash,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Error getting private transactions:', error);
    return [];
  }
}
