import {
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Account,
  Network,
} from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
dotenv.config();

// ------------------------------------------------------
// Aptos client (Testnet)
// ------------------------------------------------------
const config = new AptosConfig({
  network: Network.TESTNET,
});

export const aptos = new Aptos(config);

// ------------------------------------------------------
// Signer account from PRIVATE_KEY in .env
// ------------------------------------------------------
const privateKey = new Ed25519PrivateKey(
  process.env.PRIVATE_KEY as string
);

export const signer = Account.fromPrivateKey({
  privateKey,
});
