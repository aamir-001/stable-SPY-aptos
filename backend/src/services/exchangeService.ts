import { aptos, signer } from "../aptosClient.js";

/**
 * BUY STOCK SERVICE (debug version)
 * - Assumes base currency = INR
 * - Hardcodes price: 1 stock = 90 INR
 * - All values use 6 decimals on-chain
 */
export async function buyStockService(
  userAddress: string,
  stock: string,
  currencyAmount: number // already scaled to 1e6 by controller
) {
  // Hardcoded price: 90 INR per stock
  const priceInCurrency = 90_000_000; // 90 * 1e6

  // amount of stock user receives = currencyAmount / price
  const stockAmount = Math.floor(currencyAmount / priceInCurrency);

  console.log("MY_ADDR RAW =", JSON.stringify(process.env.MY_ADDR));

  console.log("[BUY] user:", userAddress);
  console.log("[BUY] stock:", stock);
  console.log("[BUY] currencyAmount (INR * 1e6):", currencyAmount);
  console.log("[BUY] priceInCurrency (INR * 1e6):", priceInCurrency);
  console.log("[BUY] stockAmount (tokens * 1e6):", stockAmount);

  const txn = await aptos.transaction.build.simple({
    // This is the admin signer for &signer admin in Move
    sender: signer.accountAddress,
    data: {
      function: `${process.env.MY_ADDR}::ExchangeV2::buy_stock`,
      // IMPORTANT: do NOT include admin as argument; it is implicit from sender
      functionArguments: [
        userAddress,        // user: address
        "INR",              // currency: String
        stock,              // stock: String
        currencyAmount,     // currency_amount: u64
        priceInCurrency,    // price_in_currency: u64
      ],
    },
  });

  const committed = await aptos.signAndSubmitTransaction({
    signer,
    transaction: txn,
  });

  await aptos.waitForTransaction({ transactionHash: committed.hash });

  return {
    txHash: committed.hash,
    stockAmount,
    priceInCurrency,
  };
}

/**
 * SELL STOCK SERVICE (debug version)
 * - Hardcodes price: 90 INR per stock
 */
export async function sellStockService(
  userAddress: string,
  stock: string,
  stockAmount: number // already scaled to 1e6 by controller
) {
  const priceInCurrency = 90_000_000; // 90 INR * 1e6
  const currencyAmount = stockAmount * priceInCurrency;

  console.log("[SELL] user:", userAddress);
  console.log("[SELL] stock:", stock);
  console.log("[SELL] stockAmount (tokens * 1e6):", stockAmount);
  console.log("[SELL] priceInCurrency (INR * 1e6):", priceInCurrency);
  console.log("[SELL] currencyAmount (INR * 1e6):", currencyAmount);

  const txn = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function: `${process.env.MY_ADDR}::ExchangeV2::sell_stock`,
      // Again: no admin argument, only the explicit params
      functionArguments: [
        userAddress,        // user: address
        "INR",              // currency: String
        stock,              // stock: String
        stockAmount,        // stock_amount: u64
        priceInCurrency,    // price_in_currency: u64
      ],
    },
  });

  const committed = await aptos.signAndSubmitTransaction({
    signer,
    transaction: txn,
  });

  await aptos.waitForTransaction({ transactionHash: committed.hash });

  return {
    txHash: committed.hash,
    currencyAmount,
    priceInCurrency,
  };
}
