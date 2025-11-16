import type { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export type MintINRArguments = {
  to: string; // the account address to mint INR to
  amount: number; // the INR amount to mint (in smallest unit, 6 decimals)
};

const MODULE_ADDRESS = "0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d";

export const mintINR = (args: MintINRArguments): InputTransactionData => {
  const { to, amount } = args;
  return {
    data: {
      function: `${MODULE_ADDRESS}::INRCoin::mint_inrc`,
      functionArguments: [to, amount],
    },
  };
};

