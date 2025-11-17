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
  }
};
