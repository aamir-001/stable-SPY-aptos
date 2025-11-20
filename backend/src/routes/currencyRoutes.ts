import express from "express";
import { 
  mintCurrency, 
  burnCurrency, 
  getCurrencyBalance, 
  getAllBalances
} from "../services/currencyService.js";

type CurrencyType = "INR" | "EUR" | "CNY";

const router = express.Router();

// Mint currency to user
router.post("/mint", async (req, res) => {
  try {
    const { currency, userAddress, amount } = req.body;

    if (!currency || !userAddress || !amount) {
      return res.status(400).json({
        error: "Missing required fields: currency, userAddress, amount",
      });
    }

    const result = await mintCurrency(currency as CurrencyType, userAddress, amount);
    res.json(result);
  } catch (err: any) {
    console.error("[MINT CURRENCY] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Burn currency from user
router.post("/burn", async (req, res) => {
  try {
    const { currency, userAddress, amount } = req.body;

    if (!currency || !userAddress || !amount) {
      return res.status(400).json({
        error: "Missing required fields: currency, userAddress, amount",
      });
    }

    const result = await burnCurrency(currency as CurrencyType, userAddress, amount);
    res.json(result);
  } catch (err: any) {
    console.error("[BURN CURRENCY] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get specific currency balance
router.get("/balance/:currency/:address", async (req, res) => {
  try {
    const { currency, address } = req.params;

    if (!currency || !address) {
      return res.status(400).json({ error: "Currency and address are required" });
    }

    const balance = await getCurrencyBalance(currency as CurrencyType, address);
    res.json({ 
      currency,
      address,
      balance,
      balanceFormatted: `${balance.toFixed(2)} ${currency}`
    });
  } catch (err: any) {
    console.error("[BALANCE] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get all currency balances for a user
router.get("/balances/:address", async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const balances = await getAllBalances(address);
    res.json({ 
      address,
      balances,
      formatted: {
        INR: `₹${balances.INR?.toFixed(2) || "0.00"}`,
        EUR: `€${balances.EUR?.toFixed(2) || "0.00"}`,
        CNY: `¥${balances.CNY?.toFixed(2) || "0.00"}`,
      }
    });
  } catch (err: any) {
    console.error("[ALL BALANCES] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;