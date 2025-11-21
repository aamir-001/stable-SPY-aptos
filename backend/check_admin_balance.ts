// Quick script to check admin fee wallet INR balance
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";

dotenv.config();

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

async function checkAdminBalance() {
  const adminWallet = process.env.ADMIN_FEE_WALLET;
  const myAddr = process.env.MY_ADDR;

  if (!adminWallet || !myAddr) {
    console.error("Missing environment variables");
    return;
  }

  console.log("Admin Fee Wallet:", adminWallet);
  console.log("Checking INR balance...\n");

  try {
    // Check INR balance using the view function
    const balance = await aptos.view({
      payload: {
        function: `${myAddr}::INRCoin::balance_of`,
        functionArguments: [adminWallet],
      },
    });

    const balanceInMicrounits = Number(balance[0]);
    const balanceInINR = balanceInMicrounits / 1_000_000;

    console.log("INR Balance (microunits):", balanceInMicrounits);
    console.log("INR Balance (actual):", balanceInINR.toFixed(6), "INR");
    console.log("\n✅ If balance > 0, fees are being collected successfully!");
  } catch (error) {
    console.error("Error checking balance:", error);
  }
}

checkAdminBalance();
