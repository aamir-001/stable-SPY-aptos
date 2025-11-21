import { aptos, signer } from "../aptosClient.js";
import { getStockPriceInINR } from "./priceService.js";
import { logBuyTransaction, logSellTransaction } from "./portfolioService.js";
import Decimal from 'decimal.js';

export async function buyStockService(
  userAddress: string,
  stock: string,
  currencyAmount: number
) {
  const priceInCurrency = await getStockPriceInINR(stock);
  const feePercentage = parseFloat(process.env.FEE_PERCENTAGE || '0.001'); // 0.1% default
  const adminFeeWallet = process.env.ADMIN_FEE_WALLET;

  if (!adminFeeWallet) {
    throw new Error('ADMIN_FEE_WALLET not configured');
  }

  // Use Decimal.js for precise calculations
  const currencyAmountScaled = new Decimal(currencyAmount).times(1_000_000);
  const priceDecimal = new Decimal(priceInCurrency);

  // Calculate maximum stocks that can be bought with the budget (including fee)
  // We need to find: stock_count where (stock_count * price) + (stock_count * price * fee%) <= budget
  // Simplified: stock_count * price * (1 + fee%) <= budget
  // Therefore: stock_count = budget / (price * (1 + fee%))
  const priceWithFee = priceDecimal.times(1 + feePercentage);
  const wholeStocksCount = currencyAmountScaled.dividedBy(priceWithFee).floor().toNumber();

  if (wholeStocksCount < 1) {
    const minPrice = priceDecimal.dividedBy(1_000_000).times(1 + feePercentage).toFixed(2);
    throw new Error(
      `Currency amount too low. Need at least ₹${minPrice} to buy 1 ${stock} (including 0.1% fee). ` +
      `You provided ₹${new Decimal(currencyAmount).toFixed(2)}.`
    );
  }

  // Calculate exact amount to spend for whole stocks only (precise)
  const actualAmountToSpend = priceDecimal.times(wholeStocksCount).toNumber();

  // Calculate fee (0.1% of stock purchase value) in scaled units
  const feeAmountScaled = new Decimal(actualAmountToSpend).times(feePercentage).floor().toNumber();
  const feeAmount = new Decimal(feeAmountScaled).dividedBy(1_000_000).toNumber();

  // Total amount that will be deducted from user's wallet
  const totalDeduction = actualAmountToSpend + feeAmountScaled;
  const totalDeductionInCurrency = new Decimal(totalDeduction).dividedBy(1_000_000).toNumber();

  console.log("[BUY] Stock:", stock);
  console.log("[BUY] Price per stock: ₹", priceDecimal.dividedBy(1_000_000).toFixed(2));
  console.log("[BUY] Amount provided: ₹", new Decimal(currencyAmount).toFixed(2));
  console.log("[BUY] Whole stocks to buy:", wholeStocksCount);
  console.log("[BUY] Stock purchase amount: ₹", new Decimal(actualAmountToSpend).dividedBy(1_000_000).toFixed(2));
  console.log("[BUY] Fee (0.1%): ₹", feeAmount.toFixed(2));
  console.log("[BUY] Total deduction (stock + fee): ₹", totalDeductionInCurrency.toFixed(2));
  console.log("[BUY] Change: ₹", new Decimal(currencyAmount).minus(totalDeductionInCurrency).toFixed(2));

  // The contract divides currency_amount by price to get stock_amount
  // We want: currency_amount / price = stock_amount_in_microunits
  // So: price = currency_amount / stock_amount_in_microunits
  // Since we're sending actualAmountToSpend and want wholeStocksCount * 1,000,000 microunits:
  // price = actualAmountToSpend / (wholeStocksCount * 1,000,000)
  const pricePerMicrounit = priceDecimal.dividedBy(1_000_000).floor().toNumber();

  console.log("[BUY] Price per microunit:", pricePerMicrounit);

  const txn = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function: `${process.env.MY_ADDR}::ExchangeV3::buy_stock`,
      functionArguments: [
        userAddress,
        "INR",
        stock,
        actualAmountToSpend,
        pricePerMicrounit,
        feeAmountScaled,
        adminFeeWallet,
      ],
    },
  });

  const committed = await aptos.signAndSubmitTransaction({
    signer,
    transaction: txn,
  });

  await aptos.waitForTransaction({ transactionHash: committed.hash });

  // Use Decimal for precise values to store in database
  const pricePerStock = priceDecimal.dividedBy(1_000_000).toNumber();
  const totalSpent = new Decimal(actualAmountToSpend).dividedBy(1_000_000).toNumber();

  // Log transaction to database
  try {
    await logBuyTransaction({
      walletAddress: userAddress,
      stockSymbol: stock,
      quantity: wholeStocksCount,
      pricePerShare: pricePerStock,
      totalValue: totalSpent,
      baseCurrency: 'INR',
      txHash: committed.hash,
      feeAmount: feeAmount,
    });
  } catch (error) {
    console.error('Failed to log buy transaction to database:', error);
    // Don't fail the whole operation if DB logging fails
  }

  return {
    success: true,
    txHash: committed.hash,
    stockAmount: wholeStocksCount,
    pricePerStock: pricePerStock,
    totalSpent: totalSpent,
    feeAmount: feeAmount,
    totalDeducted: totalDeductionInCurrency,
    change: new Decimal(currencyAmount).minus(totalDeductionInCurrency).toNumber(),
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
  const feePercentage = parseFloat(process.env.FEE_PERCENTAGE || '0.001'); // 0.1% default
  const adminFeeWallet = process.env.ADMIN_FEE_WALLET;

  if (!adminFeeWallet) {
    throw new Error('ADMIN_FEE_WALLET not configured');
  }

  // Use Decimal.js for precise calculations
  const priceDecimal = new Decimal(priceInCurrency);

  // User provides whole stock count, but contract expects microunits
  const stockAmountInMicrounits = new Decimal(stockAmount).times(1_000_000).floor().toNumber();

  // Contract calculates: currency_amount = stock_amount * price
  // We want the currency in microunits, so price should be per microunit
  const pricePerMicrounit = priceDecimal.dividedBy(1_000_000).floor().toNumber();
  const currencyAmountScaled = new Decimal(stockAmountInMicrounits).times(pricePerMicrounit).toNumber();

  // Calculate fee (0.1% of sale proceeds) in scaled units
  const feeAmountScaled = new Decimal(currencyAmountScaled).times(feePercentage).floor().toNumber();
  const feeAmount = new Decimal(feeAmountScaled).dividedBy(1_000_000).toNumber();

  // Net amount user receives after fee
  const netReceived = new Decimal(currencyAmountScaled).minus(feeAmountScaled).dividedBy(1_000_000).toNumber();

  console.log("[SELL] Stock:", stock);
  console.log("[SELL] Price per stock: ₹", priceDecimal.dividedBy(1_000_000).toFixed(2));
  console.log("[SELL] Stocks to sell (whole):", stockAmount);
  console.log("[SELL] Stock amount in microunits:", stockAmountInMicrounits);
  console.log("[SELL] Price per microunit:", pricePerMicrounit);
  console.log("[SELL] Gross sale amount: ₹", new Decimal(currencyAmountScaled).dividedBy(1_000_000).toFixed(2));
  console.log("[SELL] Fee (0.1%): ₹", feeAmount.toFixed(2));
  console.log("[SELL] Net received (after fee): ₹", netReceived.toFixed(2));

  const txn = await aptos.transaction.build.simple({
    sender: signer.accountAddress,
    data: {
      function: `${process.env.MY_ADDR}::ExchangeV3::sell_stock`,
      functionArguments: [
        userAddress,
        "INR",
        stock,
        stockAmountInMicrounits,
        pricePerMicrounit,
        feeAmountScaled,
        adminFeeWallet,
      ],
    },
  });

  const committed = await aptos.signAndSubmitTransaction({
    signer,
    transaction: txn,
  });

  await aptos.waitForTransaction({ transactionHash: committed.hash });

  // Use Decimal for precise values to store in database
  const pricePerStock = priceDecimal.dividedBy(1_000_000).toNumber();
  const totalReceived = new Decimal(currencyAmountScaled).dividedBy(1_000_000).toNumber();

  // Log transaction to database
  try {
    await logSellTransaction({
      walletAddress: userAddress,
      stockSymbol: stock,
      quantity: stockAmount,
      pricePerShare: pricePerStock,
      totalValue: totalReceived,
      baseCurrency: 'INR',
      txHash: committed.hash,
      feeAmount: feeAmount,
    });
  } catch (error) {
    console.error('Failed to log sell transaction to database:', error);
    // Don't fail the whole operation if DB logging fails
  }

  return {
    success: true,
    txHash: committed.hash,
    stocksSold: stockAmount,
    pricePerStock: pricePerStock,
    grossAmount: totalReceived,
    feeAmount: feeAmount,
    netReceived: netReceived,
  };
}