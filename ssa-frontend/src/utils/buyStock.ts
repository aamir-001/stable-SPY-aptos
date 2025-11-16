import type { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export type BuyStockArguments = {
  user: string; // the account address buying the stock
  currency: string; // "INR" | "CNY" | "EUR"
  stock: string; // "GOOGC" | "APPL" | "TSLA" | "NVDA" | "HOOD"
  currencyAmount: number; // amount in smallest unit (6 decimals)
  priceInCurrency: number; // price per stock in smallest unit (6 decimals)
};

const MODULE_ADDRESS = "0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d";

export const buyStock = (args: BuyStockArguments): InputTransactionData => {
  const { user, currency, stock, currencyAmount, priceInCurrency } = args;
  return {
    data: {
      function: `${MODULE_ADDRESS}::ExchangeV2::buy_stock`,
      functionArguments: [user, currency, stock, currencyAmount, priceInCurrency],
    },
  };
};

