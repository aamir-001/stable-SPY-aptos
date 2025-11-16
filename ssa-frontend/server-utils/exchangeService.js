// server-utils/exchangeService.js
import { aptos, adminAccount } from "./aptosClient.js";

const rawModuleAddr = process.env.MODULE_ADDR;
if (!rawModuleAddr) {
  throw new Error("MODULE_ADDR is missing in .env");
}

// Ensure 0x prefix
const MODULE_ADDR = rawModuleAddr.startsWith("0x")
  ? rawModuleAddr
  : "0x" + rawModuleAddr;

const MODULE = `${MODULE_ADDR}::ExchangeV2`;

export async function buyStock(user, currency, stock, currencyAmount, price) {
  console.log("DEBUG BUY ARGS:", {
    user,
    currency,
    stock,
    currencyAmount,
    price,
  });

  // 1) Build transaction
  const transaction = await aptos.transaction.build.simple({
    sender: adminAccount.accountAddress,
    data: {
      function: `${MODULE}::buy_stock`,
      // No type arguments in your Move function
      typeArguments: [],
      functionArguments: [
        user,                         // address
        currency,                     // String
        stock,                        // String
        Number(currencyAmount),       // u64
        Number(price),                // u64
      ],
    },
  });

  // 2) Sign
  const senderAuthenticator = aptos.transaction.sign({
    signer: adminAccount,
    transaction,
  });

  // 3) Submit
  const pending = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator,
  });

  // 4) Wait
  return aptos.waitForTransaction({ transactionHash: pending.hash });
}

export async function sellStock(user, currency, stock, stockAmount, price) {
  console.log("DEBUG SELL ARGS:", {
    user,
    currency,
    stock,
    stockAmount,
    price,
  });

  // 1) Build transaction
  const transaction = await aptos.transaction.build.simple({
    sender: adminAccount.accountAddress,
    data: {
      function: `${MODULE}::sell_stock`,
      typeArguments: [],
      functionArguments: [
        user,                        // address
        currency,                    // String
        stock,                       // String
        Number(stockAmount),         // u64
        Number(price),               // u64
      ],
    },
  });

  // 2) Sign
  const senderAuthenticator = aptos.transaction.sign({
    signer: adminAccount,
    transaction,
  });

  // 3) Submit
  const pending = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator,
  });

  // 4) Wait
  return aptos.waitForTransaction({ transactionHash: pending.hash });
}