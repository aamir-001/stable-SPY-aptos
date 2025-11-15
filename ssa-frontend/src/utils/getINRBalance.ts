import { aptosClient } from "./aptosClient";

export type AccountINRBalanceArguments = {
  accountAddress: string;
};

const MODULE_ADDRESS = "0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d";

export const getINRBalance = async (args: AccountINRBalanceArguments): Promise<number> => {
  const { accountAddress } = args;
  const balance = await aptosClient().view<[number]>({
    payload: {
      function: `${MODULE_ADDRESS}::INRCoin::balance_of`,
      functionArguments: [accountAddress],
    },
  });
  return balance[0];
};

