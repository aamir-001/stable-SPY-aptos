// Stock API service using Yahoo Finance (free, no API key required)
// Using CORS proxy to bypass browser CORS restrictions

// Map our symbols to Yahoo Finance symbols
const SYMBOL_MAP: Record<string, string> = {
  GOOGC: "GOOGL", // Google
  APPL: "AAPL",   // Apple
  TSLA: "TSLA",   // Tesla
  NVDA: "NVDA",   // NVIDIA
  HOOD: "HOOD",   // Robinhood
};

// CORS proxy (you can use your own backend proxy in production)
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StockData {
  date: string;
  price: number;
}

export const stockApi = {
  // Get current stock quote using Yahoo Finance
  async getStockQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const yahooSymbol = SYMBOL_MAP[symbol] || symbol;
      
      // Using Yahoo Finance API with CORS proxy
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const regularMarketPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose;
        
        if (regularMarketPrice) {
          const change = regularMarketPrice - previousClose;
          const changePercent = previousClose ? (change / previousClose) * 100 : 0;
          
          return {
            symbol: yahooSymbol,
            price: regularMarketPrice,
            change: change,
            changePercent: changePercent,
          };
        }
      }
      
      console.warn(`No price data found for ${symbol}`);
      return null;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      // Return fallback data if API fails
      return this.getFallbackQuote(symbol);
    }
  },

  // Fallback quote data (mock data when API fails)
  getFallbackQuote(symbol: string): StockQuote | null {
    const fallbackPrices: Record<string, { price: number; change: number }> = {
      GOOGC: { price: 150.50, change: 2.30 },
      APPL: { price: 175.20, change: -1.50 },
      TSLA: { price: 250.80, change: 5.20 },
      NVDA: { price: 480.30, change: 12.50 },
      HOOD: { price: 12.50, change: 0.30 },
    };

    const fallback = fallbackPrices[symbol];
    if (fallback) {
      return {
        symbol: SYMBOL_MAP[symbol] || symbol,
        price: fallback.price,
        change: fallback.change,
        changePercent: (fallback.change / (fallback.price - fallback.change)) * 100,
      };
    }
    return null;
  },

  // Get intraday stock data for the day using Yahoo Finance
  async getIntradayData(symbol: string): Promise<StockData[]> {
    try {
      const yahooSymbol = SYMBOL_MAP[symbol] || symbol;
      
      // Get intraday data (5 minute intervals)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=5m&range=1d`;
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const timestamps = result.timestamp || [];
        const prices = result.indicators?.quote?.[0]?.close || [];
        
        const dataPoints: StockData[] = [];
        
        timestamps.forEach((timestamp: number, index: number) => {
          if (prices[index] !== null && prices[index] !== undefined) {
            dataPoints.push({
              date: new Date(timestamp * 1000).toISOString(),
              price: prices[index],
            });
          }
        });

        if (dataPoints.length > 0) {
          return dataPoints;
        }
      }
      
      // Return fallback data if no intraday data
      return this.getFallbackIntradayData(symbol);
    } catch (error) {
      console.error(`Error fetching intraday data for ${symbol}:`, error);
      return this.getFallbackIntradayData(symbol);
    }
  },

  // Fallback intraday data (mock data when API fails)
  getFallbackIntradayData(symbol: string): StockData[] {
    const basePrice = this.getFallbackQuote(symbol)?.price || 100;
    const now = new Date();
    const dataPoints: StockData[] = [];
    
    // Generate mock data points for today (every 30 minutes)
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(now.getHours() - i);
      time.setMinutes(Math.floor(time.getMinutes() / 30) * 30);
      time.setSeconds(0);
      time.setMilliseconds(0);
      
      // Add some variation to the price
      const variation = (Math.random() - 0.5) * 2;
      dataPoints.push({
        date: time.toISOString(),
        price: basePrice + variation,
      });
    }
    
    return dataPoints;
  },

  // Get all stock prices
  async getAllStockPrices(): Promise<Record<string, number>> {
    const symbols = Object.keys(SYMBOL_MAP);
    const prices: Record<string, number> = {};
    
    // Fetch all quotes in parallel
    const quotes = await Promise.all(
      symbols.map(symbol => this.getStockQuote(symbol))
    );

    quotes.forEach((quote, index) => {
      if (quote) {
        prices[symbols[index]] = quote.price;
      }
    });

    return prices;
  },
};
