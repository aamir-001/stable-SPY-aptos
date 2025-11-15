import { AptosWalletAdapterProvider, useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

function WalletDemo() {
  const { connect, disconnect, connected, account, wallets } = useWallet();

  const handleConnect = async () => {
    if (wallets.length === 0) {
      alert("No Aptos wallets installed!");
      return;
    }
    await connect(wallets[0].name);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Aptos + Vite Demo</h1>

      {connected ? (
        <>
          <p>Connected as:</p>
          <code>{account?.address?.toString()}</code>
          <br /><br />
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
}

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
