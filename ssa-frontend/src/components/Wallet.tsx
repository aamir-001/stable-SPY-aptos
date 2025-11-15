import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";

export default function WalletDemo() {
  const { connect, disconnect, connected, account, wallets } = useWallet();

  const handleConnect = async () => {
    if (wallets.length === 0) {
      alert("No Aptos wallets installed!");
      return;
    }
    await connect(wallets[0].name);
  };

  return (
    <Box display="flex" justifyContent="center" mt={8}>
      <Card sx={{ width: 400, padding: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Aptos Wallet + MUI Demo
          </Typography>

          {connected ? (
            <>
              <Typography variant="body1" color="text.secondary">
                Connected as:
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  background: "#f4f4f4",
                  padding: 1,
                  borderRadius: 1,
                  wordBreak: "break-all",
                  mt: 1,
                }}
              >
                {account?.address?.toString()}
              </Typography>

              <Button
                variant="outlined"
                color="error"
                sx={{ mt: 3 }}
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={handleConnect}
              sx={{ mt: 2 }}
            >
              Connect Wallet
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
