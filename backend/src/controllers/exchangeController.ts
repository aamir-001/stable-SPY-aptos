import { Request, Response } from "express";
import { buyStockService, sellStockService } from "../services/exchangeService.js";

export const buyStock = async (req: Request, res: Response) => {
  try {
    const { userAddress, stock, amount } = req.body;

    // amount is INR → backend scales to 1e6
    const currencyAmount = amount * 1_000_000;

    const result = await buyStockService(userAddress, stock, currencyAmount);

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

    // amount already in stock tokens (u64)
    const result = await sellStockService(userAddress, stock, amount);

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
