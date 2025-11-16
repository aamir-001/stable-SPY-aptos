// 1 USD = 90 INR
const FX_RATE_INR = 90;

// Hardcoded USD stock prices for now
const USD_PRICES: Record<string, number> = {
  "GOOGC": 150.25,
  "APPL": 189.20,
  "TSLA": 220.40,
  "NVDA": 128.51,
  "HOOD": 10.93,
};

// convert price -> INR (scaled 1e6)
export function getLocalizedPrice(stock: string): number {
  const priceUsd = USD_PRICES[stock];
  if (!priceUsd) throw new Error("Unknown stock");

  const priceInr = priceUsd * FX_RATE_INR;
  
  // Scale to 6 decimals for Move
  return Math.floor(priceInr * 1_000_000);
}
