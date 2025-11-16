import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button, Box, Typography, Menu, MenuItem } from "@mui/material";
import { useState } from "react";

export default function WalletButton() {
  const { connect, disconnect, connected, account, wallets } = useWallet();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleConnect = async () => {
    if (wallets.length === 0) {
      alert("No Aptos wallets installed!");
      return;
    }
    await connect(wallets[0].name);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ position: "absolute", top: 16, right: 16 }}>
      {connected ? (
        <>
          <Button
            variant="contained"
            onClick={handleMenuOpen}
            sx={{
              bgcolor: "#00C853",
              color: "white",
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              "&:hover": { bgcolor: "#00A043", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
            }}
          >
            {account?.address?.toString().slice(0, 6)}...
            {account?.address?.toString().slice(-4)}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: "#ffffff",
                borderRadius: 2,
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                border: "1px solid #e0e0e0",
                mt: 1,
              },
            }}
          >
            <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
              <Typography variant="body2" sx={{ wordBreak: "break-all", color: "#000000" }}>
                {account?.address?.toString()}
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={() => {
                disconnect();
                handleMenuClose();
              }}
              sx={{ py: 1.5, color: "#d32f2f" }}
            >
              Disconnect
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Button
          variant="contained"
          onClick={handleConnect}
          sx={{
            bgcolor: "#00C853",
            color: "white",
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: "none",
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            "&:hover": { bgcolor: "#00A043", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
          }}
        >
          Connect Wallet
        </Button>
      )}
    </Box>
  );
}
