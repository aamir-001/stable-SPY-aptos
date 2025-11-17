import { aptos, signer } from "../aptosClient.js";
import { getStockPriceInINR } from "./priceService.js";

export async function buyStockService(
  userAddress: string,
  stock: string,
  currencyAmount: number
) {
  const priceInCurrency = await getStockPriceInINR(stock);
  const currencyAmountScaled = currencyAmount * 1_000_000;
  const stockAmount = Math.floor(currencyAmountScaled / priceInCurrency);

  if (stockAmount < 1) {
    const minPrice = priceInCurrency / 1_000_000;
    throw new Error(
      `Currency amount too low. Need at least ₹${minPrice.toFixed(2)} to buy 1 ${stock}. ` +
      `You provided ₹${currencyAmount.toFixed(2)}.`
    );
  }

  // Calculate exact amount to spend for whole stocks only
  const actualAmountToSpend = stockAmount * priceInCurrency;

  console.log("[BUY] Stock:", stock);
  console.log("[BUY] Price per stock: ₹", (priceInCurrency / 1_000_000).toFixed(2));
  console.log("[BUY] Amount provided: ₹", currencyAmount.toFixed(2));
  console.log("[BUY] Stocks to buy:", stockAmount);
  console.log("[BUY] Actual amount to spend: ₹", (actualAmountToSpend / 1_000_000).toFixed(2));
  console.log("[BUY] Change: ₹", (currencyAmount - actualAmountToSpend / 1_000_000).toFixed(2));

  const txn = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function: `${process.env.MY_ADDR}::ExchangeV2::buy_stock`,
      functionArguments: [
        userAddress,
        "INR",
        stock,
        actualAmountToSpend,
        priceInCurrency,
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
    stockAmount: stockAmount,
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
  const currencyAmountScaled = stockAmount * priceInCurrency;

  console.log("[SELL] Stock:", stock);
  console.log("[SELL] Price per stock: ₹", (priceInCurrency / 1_000_000).toFixed(2));
  console.log("[SELL] Stocks to sell:", stockAmount);
  console.log("[SELL] Currency to receive: ₹", (currencyAmountScaled / 1_000_000).toFixed(2));

  const txn = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function: `${process.env.MY_ADDR}::ExchangeV2::sell_stock`,
      functionArguments: [
        userAddress,
        "INR",
        stock,
        stockAmount,
        priceInCurrency,
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