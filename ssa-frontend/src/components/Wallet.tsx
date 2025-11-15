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
              bgcolor: "#FF8C42",
              color: "white",
              borderRadius: 2,
              px: 2,
              "&:hover": { bgcolor: "#FF7A2E" },
            }}
          >
            {account?.address?.toString().slice(0, 6)}...
            {account?.address?.toString().slice(-4)}
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>
              <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                {account?.address?.toString()}
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={() => {
                disconnect();
                handleMenuClose();
              }}
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
            bgcolor: "#FF8C42",
            color: "white",
            borderRadius: 2,
            px: 2,
            "&:hover": { bgcolor: "#FF7A2E" },
          }}
        >
          Connect Wallet
        </Button>
      )}
    </Box>
  );
}
