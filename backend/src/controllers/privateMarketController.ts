import { Request, Response } from "express";
import {
  buyPrivateStockService,
  sellPrivateStockService,
  getPrivateStockPrice,
  getAllPrivateStocks,
  getPrivateStockBalance,
  getPrivatePortfolio,
  getPrivateTransactions,
} from "../services/privateMarketService.js";

export const getPrivateStocks = async (req: Request, res: Response) => {
  try {
    const stocks = getAllPrivateStocks();
    res.json({
      success: true,
      stocks,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPrivatePrice = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: "Missing symbol parameter" });
    }

    const price = getPrivateStockPrice(symbol);
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      price,
      currency: "USDC",
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getPrivateBalance = async (req: Request, res: Response) => {
  try {
    const { address, symbol } = req.params;

    if (!address || !symbol) {
      return res.status(400).json({ error: "Missing address or symbol parameter" });
    }

    const balance = await getPrivateStockBalance(address, symbol);
    res.json({
      success: true,
      address,
      symbol: symbol.toUpperCase(),
      balance,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const buyPrivateStock = async (req: Request, res: Response) => {
  try {
    const { userAddress, stock, amount } = req.body;

    if (!userAddress || !stock || !amount) {
      return res.status(400).json({
        error: "Missing required fields: userAddress, stock, amount (USDC)"
      });
    }

    // amount is in USDC (not scaled)
    const result = await buyPrivateStockService(userAddress, stock, amount);

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const sellPrivateStock = async (req: Request, res: Response) => {
  try {
    const { userAddress, stock, amount } = req.body;

    if (!userAddress || !stock || !amount) {
      return res.status(400).json({
        error: "Missing required fields: userAddress, stock, amount (tokens)"
      });
    }

    // amount is in whole tokens
    const result = await sellPrivateStockService(userAddress, stock, amount);

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPrivatePortfolioHandler = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: "Missing address parameter" });
    }

    const portfolio = await getPrivatePortfolio(address);
    res.json({
      success: true,
      address,
      portfolio,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPrivateTransactionsHandler = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: "Missing address parameter" });
    }

    const transactions = await getPrivateTransactions(address);
    res.json({
      success: true,
      address,
      transactions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
