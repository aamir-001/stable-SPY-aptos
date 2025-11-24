import express from "express";
import {
  getPrivateStocks,
  getPrivatePrice,
  getPrivateBalance,
  buyPrivateStock,
  sellPrivateStock,
  getPrivatePortfolioHandler,
  getPrivateTransactionsHandler,
} from "../controllers/privateMarketController.js";

const router = express.Router();

// Get all available private stocks with prices
router.get("/stocks", getPrivateStocks);

// Get price for a specific private stock
router.get("/price/:symbol", getPrivatePrice);

// Get user's balance for a specific private stock
router.get("/balance/:address/:symbol", getPrivateBalance);

// Buy private stock with USDC
router.post("/buy", buyPrivateStock);

// Sell private stock for USDC
router.post("/sell", sellPrivateStock);

// Get user's private market portfolio
router.get("/portfolio/:address", getPrivatePortfolioHandler);

// Get user's private market transactions
router.get("/transactions/:address", getPrivateTransactionsHandler);

export default router;
