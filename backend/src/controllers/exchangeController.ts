import { Request, Response } from "express";
import { buyStockService, sellStockService } from "../services/exchangeService.js";

export const buyStock = async (req: Request, res: Response) => {
  try {
    const { userAddress, stock, amount } = req.body;

    if (!userAddress || !stock || !amount) {
      return res.status(400).json({
        error: "Missing required fields: userAddress, stock, amount"
      });
    }

    // amount is already in INR (NOT scaled) - service will scale it
    const result = await buyStockService(userAddress, stock, amount);

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const sellStock = async (req: Request, res: Response) => {
  try {
    const { userAddress, stock, amount } = req.body;

    if (!userAddress || !stock || !amount) {
      return res.status(400).json({
        error: "Missing required fields: userAddress, stock, amount"
      });
    }

    // amount is in stock tokens (u64)
    const result = await sellStockService(userAddress, stock, amount);

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};