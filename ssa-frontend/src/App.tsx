import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import WalletDemo from "./components/Wallet";

export default function App() {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{ network: Network.TESTNET }}
    >
      <WalletDemo />
    </AptosWalletAdapterProvider>
  );
}
