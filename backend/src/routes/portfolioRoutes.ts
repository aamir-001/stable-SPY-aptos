import express from 'express';
import { getPortfolioOverview, getStockPosition, getUserTransactions, getUserInfo } from '../services/portfolioService.js';
import { getStockPriceFromYahoo } from '../services/priceService.js';
import { getStockBalance } from '../services/tokenService.js';

const router = express.Router();

// GET /portfolio/:address - Get portfolio overview with P&L
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Get user info to determine base currency
    const userInfo = await getUserInfo(address);
    const baseCurrency = userInfo?.baseCurrency || 'INR';

    // Exchange rates: USD to other currencies
    const exchangeRates: Record<string, number> = {
      USD: 1.0,
      INR: 90.0,
      CNY: 7.2,
      EUR: 0.92,
    };

    const exchangeRate = exchangeRates[baseCurrency] || 90.0;

    // Get all supported stock symbols
    const ALL_STOCKS = ['GOOG', 'AAPL', 'TSLA', 'NVDA', 'HOOD'];

    // Get database positions for cost basis lookup
    const dbPositions = await getPortfolioOverview(address);
    const positionMap = new Map(dbPositions.map(p => [p.stockSymbol, p]));

    // Fetch on-chain balances for all stocks and build portfolio
    const portfolioWithPnL = await Promise.all(
      ALL_STOCKS.map(async (stockSymbol) => {
        try {
          // Get current on-chain balance (source of truth)
          const onChainBalance = await getStockBalance(stockSymbol, address);

          // Skip if no on-chain balance
          if (onChainBalance <= 0) {
            return null;
          }

          // Get database position for cost basis (if exists)
          const dbPosition = positionMap.get(stockSymbol);
          const totalCostBasis = dbPosition?.totalCostBasis || 0;
          const averageCostPerShare = dbPosition?.averageCostPerShare || 0;
          const realizedProfitLoss = dbPosition?.realizedProfitLoss || 0;

          // Get current price from Yahoo Finance
          const currentPrice = await getStockPriceFromYahoo(stockSymbol);
          const currentPriceInBaseCurrency = currentPrice * exchangeRate;

          // Calculate unrealized P&L using on-chain balance
          const currentValue = onChainBalance * currentPriceInBaseCurrency;
          const unrealizedPnl = currentValue - totalCostBasis;
          const unrealizedPnlPercent =
            totalCostBasis > 0 ? (unrealizedPnl / totalCostBasis) * 100 : 0;

          return {
            stockSymbol,
            currentQuantity: onChainBalance, // Use on-chain balance as source of truth
            currentPrice: currentPriceInBaseCurrency,
            currentValue: currentValue,
            totalCostBasis: totalCostBasis,
            averageCostPerShare: averageCostPerShare,
            unrealizedPnl: unrealizedPnl,
            unrealizedPnlPercent: unrealizedPnlPercent,
            realizedPnl: realizedProfitLoss,
            totalPnl: unrealizedPnl + realizedProfitLoss,
            baseCurrency: baseCurrency,
          };
        } catch (error) {
          console.error(`Error fetching data for ${stockSymbol}:`, error);
          // Skip positions with errors
          return null;
        }
      })
    );

    // Filter out null positions
    const validPositions = portfolioWithPnL.filter(p => p !== null);

    // Calculate total portfolio value
    const totalValue = validPositions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalCostBasis = validPositions.reduce((sum, p) => sum + p.totalCostBasis, 0);
    const totalUnrealizedPnl = validPositions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0);
    const totalRealizedPnl = validPositions.reduce((sum, p) => sum + p.realizedPnl, 0);
    const totalPnl = totalUnrealizedPnl + totalRealizedPnl;

    res.json({
      success: true,
      address,
      positions: validPositions,
      summary: {
        totalValue,
        totalCostBasis,
        totalUnrealizedPnl,
        totalRealizedPnl,
        totalPnl,
        totalPnlPercent: totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0,
      },
    });
  } catch (error: any) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get portfolio',
    });
  }
});

// GET /portfolio/:address/stock/:stock - Get detailed position for a specific stock
router.get('/:address/stock/:stock', async (req, res) => {
  try {
    const { address, stock } = req.params;

    const position = await getStockPosition(address, stock.toUpperCase());

    if (!position) {
      return res.status(404).json({
        success: false,
        error: `No position found for ${stock}`,
      });
    }

    // Exchange rates: USD to other currencies
    const exchangeRates: Record<string, number> = {
      USD: 1.0,
      INR: 90.0,
      CNY: 7.2,
      EUR: 0.92,
    };

    const exchangeRate = exchangeRates[position.baseCurrency] || 90.0;

    // Get current price
    const currentPrice = await getStockPriceFromYahoo(stock.toUpperCase());
    const currentPriceInBaseCurrency = currentPrice * exchangeRate;

    // Calculate unrealized P&L
    const currentValue = position.currentQuantity * currentPriceInBaseCurrency;
    const unrealizedPnl = currentValue - position.totalCostBasis;
    const unrealizedPnlPercent =
      position.totalCostBasis > 0 ? (unrealizedPnl / position.totalCostBasis) * 100 : 0;

    // Calculate total cost including sold shares for overall return %
    const totalHistoricalCost = position.transactions
      .filter((tx) => tx.type === 'BUY')
      .reduce((sum, tx) => sum + tx.totalValue, 0);

    const totalPnl = unrealizedPnl + position.realizedProfitLoss;
    const totalPnlPercent = totalHistoricalCost > 0 ? (totalPnl / totalHistoricalCost) * 100 : 0;

    res.json({
      success: true,
      stockSymbol: position.stockSymbol,
      currentPrice: currentPriceInBaseCurrency,
      position: {
        currentQuantity: position.currentQuantity,
        currentValue: currentValue,
        totalCostBasis: position.totalCostBasis,
        averageCostPerShare: position.averageCostPerShare,
      },
      pnl: {
        unrealizedPnl,
        unrealizedPnlPercent,
        realizedPnl: position.realizedProfitLoss,
        totalPnl,
        totalPnlPercent,
      },
      baseCurrency: position.baseCurrency,
      transactions: position.transactions,
    });
  } catch (error: any) {
    console.error('Error getting stock position:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stock position',
    });
  }
});

// GET /portfolio/:address/transactions - Get transaction history
router.get('/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const transactions = await getUserTransactions(address, limit);

    res.json({
      success: true,
      address,
      transactions,
    });
  } catch (error: any) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get transactions',
    });
  }
});

// GET /portfolio/:address/user-info - Get user info (base currency, etc.)
router.get('/:address/user-info', async (req, res) => {
  try {
    const { address } = req.params;

    const userInfo = await getUserInfo(address);

    if (!userInfo) {
      // User doesn't exist yet - return default
      return res.json({
        success: true,
        exists: false,
        baseCurrency: 'INR', // Default base currency
      });
    }

    res.json({
      success: true,
      exists: true,
      ...userInfo,
    });
  } catch (error: any) {
    console.error('Error getting user info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user info',
    });
  }
});

export default router;
