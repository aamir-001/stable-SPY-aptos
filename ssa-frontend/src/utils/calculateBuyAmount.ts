import { aptosClient } from "./aptosClient";

export type CalculateBuyAmountArguments = {
  currencyAmount: number;
  priceInCurrency: number;
};

const MODULE_ADDRESS = "0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d";

export const calculateBuyAmount = async (args: CalculateBuyAmountArguments): Promise<number> => {
  const { currencyAmount, priceInCurrency } = args;
  const result = await aptosClient().view<[number]>({
    payload: {
      function: `${MODULE_ADDRESS}::ExchangeV2::calculate_buy_amount`,
      functionArguments: [currencyAmount, priceInCurrency],
    },
  });
  return result[0];
};

