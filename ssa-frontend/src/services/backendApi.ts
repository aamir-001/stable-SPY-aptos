// Backend API service for contract interactions
// This service connects to the Express backend server

import axios from 'axios';

// Use relative API path for Vite proxy in development
// In production, this should be configured to point to the actual backend URL
const API_BASE_URL = '/api';

export interface BuyStockRequest {
  userAddress: string;
  stock: string;
  amount: number;
}

export interface BuyStockResponse {
  success: boolean;
  txHash: string;
  stockAmount: number;
  pricePerStock: number;
  totalSpent: number;
  change: number;
}

export interface SellStockRequest {
  userAddress: string;
  stock: string;
  amount: number;
}

export interface SellStockResponse {
  success: boolean;
  txHash: string;
  stocksSold: number;
  pricePerStock: number;
  totalReceived: number;
}

export interface MintCurrencyRequest {
  currency: 'INR' | 'EUR' | 'CNY';
  userAddress: string;
  amount: number;
}

export interface MintCurrencyResponse {
  success: boolean;
  txHash: string;
  currency: string;
  amount: number;
  scaledAmount: number;
}

export interface CurrencyBalances {
  address: string;
  balances: {
    INR: number;
    EUR: number;
    CNY: number;
  };
  formatted: {
    INR: string;
    EUR: string;
    CNY: string;
  };
}

export interface PortfolioPosition {
  stockSymbol: string;
  currentQuantity: number;
  currentPrice: number | null;
  currentValue: number | null;
  totalCostBasis: number;
  averageCostPerShare: number;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  realizedPnl: number;
  totalPnl: number | null;
  baseCurrency: string;
}

export interface PortfolioOverview {
  success: boolean;
  address: string;
  positions: PortfolioPosition[];
  summary: {
    totalValue: number;
    totalCostBasis: number;
    totalUnrealizedPnl: number;
    totalRealizedPnl: number;
    totalPnl: number;
    totalPnlPercent: number;
  };
}

export interface Transaction {
  type: string;
  stockSymbol?: string;
  currencySymbol?: string;
  quantity: number;
  pricePerShare: number | null;
  totalValue: number;
  realizedPnl: number | null;
  baseCurrency: string;
  txHash: string;
  status: string;
  timestamp: string;
}

export interface StockPositionDetail {
  success: boolean;
  stockSymbol: string;
  currentPrice: number;
  position: {
    currentQuantity: number;
    currentValue: number;
    totalCostBasis: number;
    averageCostPerShare: number;
  };
  pnl: {
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
    realizedPnl: number;
    totalPnl: number;
    totalPnlPercent: number;
  };
  baseCurrency: string;
  transactions: Transaction[];
}

export interface UserInfo {
  success: boolean;
  exists: boolean;
  id?: string;
  walletAddress?: string;
  baseCurrency: string;
  createdAt?: string;
  updatedAt?: string;
}

// Private Market types
export interface PrivateStock {
  symbol: string;
  price: number;
  metadata: string;
  module: string;
}

export interface BuyPrivateStockRequest {
  userAddress: string;
  stock: string;
  amount: number; // USDC amount
}

export interface BuyPrivateStockResponse {
  success: boolean;
  txHash: string;
  tokenAmount: number;
  pricePerToken: number;
  totalSpent: number;
  feeAmount: number;
  totalDeducted: number;
  change: number;
}

export interface SellPrivateStockRequest {
  userAddress: string;
  stock: string;
  amount: number; // Token amount
}

export interface SellPrivateStockResponse {
  success: boolean;
  txHash: string;
  tokensSold: number;
  pricePerToken: number;
  grossAmount: number;
  feeAmount: number;
  netReceived: number;
}

export const backendApi = {
  // Buy stock using backend endpoint
  async buyStock(request: BuyStockRequest): Promise<BuyStockResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/exchange/buy`, request);
      return response.data;
    } catch (error: any) {
      console.error('Buy stock error:', error);
      throw new Error(error.response?.data?.error || 'Failed to buy stock');
    }
  },

  // Sell stock using backend endpoint
  async sellStock(request: SellStockRequest): Promise<SellStockResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/exchange/sell`, request);
      return response.data;
    } catch (error: any) {
      console.error('Sell stock error:', error);
      throw new Error(error.response?.data?.error || 'Failed to sell stock');
    }
  },

  // Get stock balance for a specific stock using backend endpoint
  async getStockBalance(stock: string, address: string): Promise<number> {
    try {
      const response = await axios.get(`${API_BASE_URL}/token/stock/${stock}/balance/${address}`);
      return response.data.balance;
    } catch (error: any) {
      console.error('Get stock balance error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get stock balance');
    }
  },

  // Mint currency using backend endpoint
  async mintCurrency(request: MintCurrencyRequest): Promise<MintCurrencyResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/currency/mint`, request);
      return response.data;
    } catch (error: any) {
      console.error('Mint currency error:', error);
      throw new Error(error.response?.data?.error || 'Failed to mint currency');
    }
  },

  // Get all currency balances for a user
  async getCurrencyBalances(address: string): Promise<CurrencyBalances> {
    try {
      const response = await axios.get(`${API_BASE_URL}/currency/balances/${address}`);
      return response.data;
    } catch (error: any) {
      console.error('Get currency balances error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get currency balances');
    }
  },

  // Get single currency balance
  async getCurrencyBalance(currency: 'INR' | 'EUR' | 'CNY', address: string): Promise<number> {
    try {
      const response = await axios.get(`${API_BASE_URL}/currency/balance/${currency}/${address}`);
      return response.data.balance;
    } catch (error: any) {
      console.error('Get currency balance error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get currency balance');
    }
  },

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/`);
      return response.data;
    } catch (error: any) {
      console.error('Health check error:', error);
      throw new Error('Backend is not responding');
    }
  },

  // Get portfolio overview with P&L
  async getPortfolio(address: string): Promise<PortfolioOverview> {
    try {
      const response = await axios.get(`${API_BASE_URL}/portfolio/${address}`);
      return response.data;
    } catch (error: any) {
      console.error('Get portfolio error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get portfolio');
    }
  },

  // Get detailed stock position with transactions
  async getStockPosition(address: string, stock: string): Promise<StockPositionDetail> {
    try {
      const response = await axios.get(`${API_BASE_URL}/portfolio/${address}/stock/${stock}`);
      return response.data;
    } catch (error: any) {
      console.error('Get stock position error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get stock position');
    }
  },

  // Get transaction history
  async getTransactions(address: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/portfolio/${address}/transactions?limit=${limit}`);
      return response.data.transactions || [];
    } catch (error: any) {
      console.error('Get transactions error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get transactions');
    }
  },

  // Get user info (base currency, etc.)
  async getUserInfo(address: string): Promise<UserInfo> {
    try {
      const response = await axios.get(`${API_BASE_URL}/portfolio/${address}/user-info`);
      return response.data;
    } catch (error: any) {
      console.error('Get user info error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get user info');
    }
  },

  // ===== Private Market APIs =====

  // Get all available private stocks
  async getPrivateStocks(): Promise<{ success: boolean; stocks: PrivateStock[] }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/private/stocks`);
      return response.data;
    } catch (error: any) {
      console.error('Get private stocks error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get private stocks');
    }
  },

  // Get private stock price
  async getPrivateStockPrice(symbol: string): Promise<{ success: boolean; symbol: string; price: number; currency: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/private/price/${symbol}`);
      return response.data;
    } catch (error: any) {
      console.error('Get private stock price error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get private stock price');
    }
  },

  // Get private stock balance
  async getPrivateStockBalance(address: string, symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${API_BASE_URL}/private/balance/${address}/${symbol}`);
      return response.data.balance;
    } catch (error: any) {
      console.error('Get private stock balance error:', error);
      return 0;
    }
  },

  // Buy private stock with USDC
  async buyPrivateStock(request: BuyPrivateStockRequest): Promise<BuyPrivateStockResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/private/buy`, request);
      return response.data;
    } catch (error: any) {
      console.error('Buy private stock error:', error);
      throw new Error(error.response?.data?.error || 'Failed to buy private stock');
    }
  },

  // Sell private stock for USDC
  async sellPrivateStock(request: SellPrivateStockRequest): Promise<SellPrivateStockResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/private/sell`, request);
      return response.data;
    } catch (error: any) {
      console.error('Sell private stock error:', error);
      throw new Error(error.response?.data?.error || 'Failed to sell private stock');
    }
  },

  // Get private market portfolio
  async getPrivatePortfolio(address: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/private/portfolio/${address}`);
      return response.data;
    } catch (error: any) {
      console.error('Get private portfolio error:', error);
      return { success: true, portfolio: [] };
    }
  },

  // Get private market transactions
  async getPrivateTransactions(address: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/private/transactions/${address}`);
      return response.data.transactions || [];
    } catch (error: any) {
      console.error('Get private transactions error:', error);
      return [];
    }
  }
};
