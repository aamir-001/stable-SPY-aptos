import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Dialog, DialogContent, Typography, Box, CircularProgress } from "@mui/material";
import { getAccountAPTBalance } from "../utils/getAccountBalance";

interface BalanceModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BalanceModal({ open, onClose }: BalanceModalProps) {
  const { account } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && account?.address) {
      setLoading(true);
      setError(null);
      getAccountAPTBalance({ accountAddress: account.address.toString() })
        .then((bal) => {
          setBalance(bal / 100000000); // Convert from octas to APT
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to fetch balance");
          setLoading(false);
        });
    }
  }, [open, account?.address]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: "#1a1a1a",
          borderRadius: 3,
          boxShadow: "0 0 2px #888",
          minWidth: 300,
        },
      }}
    >
      <DialogContent>
        <Typography variant="h6" sx={{ mb: 2, color: "#FF8C42" }}>
          APT Balance
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress sx={{ color: "#FF8C42" }} />
          </Box>
        ) : error ? (
          <Typography variant="body2" sx={{ color: "#ff4444" }}>
            {error}
          </Typography>
        ) : (
          <Typography variant="h4" sx={{ color: "#fff", textAlign: "center" }}>
            {balance !== null ? balance.toFixed(4) : "0.0000"} APT
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

