const USD_TO_INR = 90;

// Real stock ticker symbols
const SUPPORTED_STOCKS = ["GOOG", "AAPL", "TSLA", "NVDA", "HOOD"];

// Hardcoded fallback prices in USD
const HARDCODED_USD_PRICES: Record<string, number> = {
  "GOOG": 165.50,   // Google
  "AAPL": 225.00,   // Apple
  "TSLA": 350.75,   // Tesla
  "NVDA": 140.25,   // NVIDIA
  "HOOD": 28.50     // Robinhood
};

export async function getStockPriceInINR(stock: string): Promise<number> {
  const normalized = stock.toUpperCase();

  // Check if stock is supported
  if (!SUPPORTED_STOCKS.includes(normalized)) {
    throw new Error(`Unknown stock symbol: ${stock}. Supported: ${SUPPORTED_STOCKS.join(", ")}`);
  }

  // Try Yahoo Finance Chart API first
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${normalized}?interval=1d&range=1d`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;
      const regularMarketPrice = meta.regularMarketPrice;
      
      if (regularMarketPrice) {
        const usdPrice = regularMarketPrice;
        // Price for 1 whole stock in INR (not scaled)
        const inrPrice = usdPrice * USD_TO_INR;
        // Price for 1 microunit of stock in microunits of INR
        // 1 whole stock = 1,000,000 microunits
        // So price per microunit = inrPrice (in microunits)
        const inrPriceScaled = Math.floor(inrPrice * 1_000_000);

        console.log(`[PRICE YAHOO] ${normalized}: $${usdPrice.toFixed(2)} = ₹${inrPrice.toFixed(2)} per stock`);
        console.log(`[PRICE YAHOO] Price in microunits: ${inrPriceScaled}`);

        return inrPriceScaled;
      }
    }
    
    throw new Error(`No price data found for ${normalized}`);
  } catch (err: any) {
    console.warn(`[PRICE] Yahoo Finance failed for ${normalized}, using fallback:`, err.message);
  }

  // Fallback to hardcoded price
  const usdPrice = HARDCODED_USD_PRICES[normalized];
  const inrPrice = usdPrice * USD_TO_INR;
  const inrPriceScaled = Math.floor(inrPrice * 1_000_000);

  console.log(`[PRICE HARDCODED] ${normalized}: $${usdPrice.toFixed(2)} = ₹${inrPrice.toFixed(2)} per stock`);
  console.log(`[PRICE HARDCODED] Price in microunits: ${inrPriceScaled}`);

  return inrPriceScaled;
}

export function getSupportedStocks(): string[] {
  return SUPPORTED_STOCKS;
}

/**
 * Get stock price from Yahoo Finance in USD (for portfolio P&L calculations)
 * @param stock - Stock symbol (e.g., "GOOG", "AAPL")
 * @returns Price in USD (not scaled)
 */
export async function getStockPriceFromYahoo(stock: string): Promise<number> {
  const normalized = stock.toUpperCase();

  // Check if stock is supported
  if (!SUPPORTED_STOCKS.includes(normalized)) {
    throw new Error(`Unknown stock symbol: ${stock}. Supported: ${SUPPORTED_STOCKS.join(", ")}`);
  }

  // Try Yahoo Finance Chart API first
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${normalized}?interval=1d&range=1d`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;
      const regularMarketPrice = meta.regularMarketPrice;

      if (regularMarketPrice) {
        console.log(`[PRICE YAHOO] ${normalized}: $${regularMarketPrice.toFixed(2)}`);
        return regularMarketPrice;
      }
    }

    throw new Error(`No price data found for ${normalized}`);
  } catch (err: any) {
    console.warn(`[PRICE] Yahoo Finance failed for ${normalized}, using fallback:`, err.message);
  }

  // Fallback to hardcoded price
  const usdPrice = HARDCODED_USD_PRICES[normalized];
  console.log(`[PRICE HARDCODED] ${normalized}: $${usdPrice.toFixed(2)}`);

  return usdPrice;
}