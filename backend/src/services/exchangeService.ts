import { aptos, signer } from "../aptosClient.js";
import { getStockPriceInINR } from "./priceService.js";

export async function buyStockService(
  userAddress: string,
  stock: string,
  currencyAmount: number
) {
  const priceInCurrency = await getStockPriceInINR(stock);
  const currencyAmountScaled = currencyAmount * 1_000_000;

  // Calculate how many whole stocks can be bought
  const wholeStocksCount = Math.floor(currencyAmountScaled / priceInCurrency);

  if (wholeStocksCount < 1) {
    const minPrice = priceInCurrency / 1_000_000;
    throw new Error(
      `Currency amount too low. Need at least ₹${minPrice.toFixed(2)} to buy 1 ${stock}. ` +
      `You provided ₹${currencyAmount.toFixed(2)}.`
    );
  }

  // Calculate exact amount to spend for whole stocks only
  const actualAmountToSpend = wholeStocksCount * priceInCurrency;

  console.log("[BUY] Stock:", stock);
  console.log("[BUY] Price per stock: ₹", (priceInCurrency / 1_000_000).toFixed(2));
  console.log("[BUY] Amount provided: ₹", currencyAmount.toFixed(2));
  console.log("[BUY] Whole stocks to buy:", wholeStocksCount);
  console.log("[BUY] Actual amount to spend: ₹", (actualAmountToSpend / 1_000_000).toFixed(2));
  console.log("[BUY] Change: ₹", (currencyAmount - actualAmountToSpend / 1_000_000).toFixed(2));

  // The contract divides currency_amount by price to get stock_amount
  // We want: currency_amount / price = stock_amount_in_microunits
  // So: price = currency_amount / stock_amount_in_microunits
  // Since we're sending actualAmountToSpend and want wholeStocksCount * 1,000,000 microunits:
  // price = actualAmountToSpend / (wholeStocksCount * 1,000,000)
  const pricePerMicrounit = Math.floor(priceInCurrency / 1_000_000);

  console.log("[BUY] Price per microunit:", pricePerMicrounit);

  const txn = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function: `${process.env.MY_ADDR}::ExchangeV2::buy_stock`,
      functionArguments: [
        userAddress,
        "INR",
        stock,
        actualAmountToSpend,
        pricePerMicrounit,
      ],
    },
  });

  const committed = await aptos.signAndSubmitTransaction({
    signer,
    transaction: txn,
  });

  await aptos.waitForTransaction({ transactionHash: committed.hash });

  return {
    success: true,
    txHash: committed.hash,
    stockAmount: wholeStocksCount,
    pricePerStock: priceInCurrency / 1_000_000,
    totalSpent: actualAmountToSpend / 1_000_000,
    change: currencyAmount - actualAmountToSpend / 1_000_000,
  };
}

export async function sellStockService(
  userAddress: string,
  stock: string,
  stockAmount: number
) {
  if (stockAmount <= 0) {
    throw new Error("Stock amount must be greater than 0");
  }

  const priceInCurrency = await getStockPriceInINR(stock);

  // User provides whole stock count, but contract expects microunits
  const stockAmountInMicrounits = Math.floor(stockAmount * 1_000_000);

  // Contract calculates: currency_amount = stock_amount * price
  // We want the currency in microunits, so price should be per microunit
  const pricePerMicrounit = Math.floor(priceInCurrency / 1_000_000);
  const currencyAmountScaled = stockAmountInMicrounits * pricePerMicrounit;

  console.log("[SELL] Stock:", stock);
  console.log("[SELL] Price per stock: ₹", (priceInCurrency / 1_000_000).toFixed(2));
  console.log("[SELL] Stocks to sell (whole):", stockAmount);
  console.log("[SELL] Stock amount in microunits:", stockAmountInMicrounits);
  console.log("[SELL] Price per microunit:", pricePerMicrounit);
  console.log("[SELL] Currency to receive: ₹", (currencyAmountScaled / 1_000_000).toFixed(2));

  const txn = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function: `${process.env.MY_ADDR}::ExchangeV2::sell_stock`,
      functionArguments: [
        userAddress,
        "INR",
        stock,
        stockAmountInMicrounits,
        pricePerMicrounit,
      ],
    },
  });

  const committed = await aptos.signAndSubmitTransaction({
    signer,
    transaction: txn,
  });

  await aptos.waitForTransaction({ transactionHash: committed.hash });

  return {
    success: true,
    txHash: committed.hash,
    stocksSold: stockAmount,
    pricePerStock: priceInCurrency / 1_000_000,
    totalReceived: currencyAmountScaled / 1_000_000,
  };
}