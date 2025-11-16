// exchangeRoutes.js
const express = require("express");
const router = express.Router();
const { buyStock, sellStock } = require("./exchangeService");

router.post("/buy-stock", async (req, res) => {
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

router.post("/sell-stock", async (req, res) => {
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

module.exports = router;