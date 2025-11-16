// server.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { buyStock, sellStock } from "./server-utils/exchangeService.js";

const app = express();
const PORT = process.env.PORT || 3001;
dotenv.config();
// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Buy stock route
app.post("/api/buy-stock", async (req, res) => {
  console.log("BUY STOCK REQUEST RECEIVED");
  try {
    console.log("REQ BODY:", req.body);
    const { user, currency, stock, currencyAmount, price } = req.body;
    const result = await buyStock(user, currency, stock, currencyAmount, price);
    res.json({ success: true, tx: result });
  } catch (err) {
    console.error("BUY ERROR:", err);
    res.status(500).json({ success: false, error: err.toString() });
  }
});

// Sell stock route
app.post("/api/sell-stock", async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    const { user, currency, stock, stockAmount, price } = req.body;
    const result = await sellStock(user, currency, stock, stockAmount, price);
    res.json({ success: true, tx: result });
  } catch (err) {
    console.error("SELL ERROR:", err);
    res.status(500).json({ success: false, error: err.toString() });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Network: ${process.env.NETWORK || "testnet"}`);
});