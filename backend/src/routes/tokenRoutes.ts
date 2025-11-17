import express from "express";
import { getStockBalance, getCurrencyBalance } from "../services/tokenService.js";

const router = express.Router();

// GET /token/stock/:stock/balance/:address
router.get("/stock/:stock/balance/:address", async (req, res) => {
  try {
    const { stock, address } = req.params;
    const balance = await getStockBalance(stock.toUpperCase(), address);
    res.json({ success: true, stock, address, balance });
  } catch (error: any) {
    console.error("Error getting stock balance:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /token/currency/:currency/balance/:address
router.get("/currency/:currency/balance/:address", async (req, res) => {
  try {
    const { currency, address } = req.params;
    const balance = await getCurrencyBalance(currency.toUpperCase(), address);
    res.json({ success: true, currency, address, balance });
  } catch (error: any) {
    console.error("Error getting currency balance:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
