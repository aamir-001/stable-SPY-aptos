// aptosClient.js
require("dotenv").config();

const {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
} = require("@aptos-labs/ts-sdk");

const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error("ADMIN_PRIVATE_KEY is missing in .env");
}

// Normalize to 0x-prefixed hex
const PRIVATE_KEY_HEX = PRIVATE_KEY.startsWith("0x")
  ? PRIVATE_KEY
  : "0x" + PRIVATE_KEY;

// Configure network (default to testnet)
let network = Network.TESTNET;
if (process.env.NETWORK === "mainnet") {
  network = Network.MAINNET;
} else if (process.env.NETWORK === "devnet") {
  network = Network.DEVNET;
}

const config = new AptosConfig({ network });
const aptos = new Aptos(config);

// Create Ed25519 key + account
const privateKey = new Ed25519PrivateKey(PRIVATE_KEY_HEX);
const adminAccount = Account.fromPrivateKey({ privateKey });

console.log("Admin address:", adminAccount.accountAddress.toString());

module.exports = { aptos, adminAccount };