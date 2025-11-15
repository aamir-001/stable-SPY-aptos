// Mock API service for contract interactions
// In production, these would call your backend endpoints

const MODULE_ADDRESS = "0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d";

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Get INR Balance
  async getINRBalance(accountAddress: string): Promise<number> {
    await delay(500);
    // Mock balance: random between 1000-10000 INR
    return Math.floor(Math.random() * 9000 + 1000) * Math.pow(10, 6);
  },

  // Get APT Balance
  async getAPTBalance(accountAddress: string): Promise<number> {
    await delay(500);
    // Mock balance: random between 10-100 APT
    return Math.floor(Math.random() * 90 + 10) * Math.pow(10, 8);
  },

  // Mint INR
  async mintINR(to: string, amount: number): Promise<{ hash: string }> {
    await delay(1500);
    return {
      hash: `0x${Math.random().toString(16).substring(2, 66)}`,
    };
  },

  // Buy Stock
  async buyStock(
    user: string,
    currency: string,
    stock: string,
    currencyAmount: number,
    priceInCurrency: number
  ): Promise<{ hash: string }> {
    await delay(1500);
    return {
      hash: `0x${Math.random().toString(16).substring(2, 66)}`,
    };
  },

  // Calculate Buy Amount
  async calculateBuyAmount(currencyAmount: number, priceInCurrency: number): Promise<number> {
    await delay(300);
    if (priceInCurrency === 0) return 0;
    return Math.floor(currencyAmount / priceInCurrency);
  },

  // Get Stock Prices (mock real-time data)
  async getStockPrices(): Promise<Record<string, number>> {
    await delay(300);
    return {
      GOOGC: 150.5 + Math.random() * 10 - 5,
      APPL: 175.2 + Math.random() * 10 - 5,
      TSLA: 250.8 + Math.random() * 15 - 7.5,
      NVDA: 480.3 + Math.random() * 20 - 10,
      HOOD: 12.5 + Math.random() * 2 - 1,
    };
  },

  // Get Exchange Rates
  async getExchangeRates(): Promise<Record<string, number>> {
    await delay(300);
    return {
      INR: 83.5 + Math.random() * 0.5 - 0.25,
      USD: 1.0,
      CNY: 7.2 + Math.random() * 0.1 - 0.05,
      EUR: 0.92 + Math.random() * 0.02 - 0.01,
    };
  },
};

