import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Dialog, DialogContent, Typography, Box, CircularProgress } from "@mui/material";
import { mockApi } from "../services/mockApi";

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
      mockApi
        .getAPTBalance(account.address.toString())
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
          bgcolor: "#ffffff",
          borderRadius: 2,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          border: "1px solid #e0e0e0",
          minWidth: 350,
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
          APT Balance
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress sx={{ color: "#00C853" }} />
          </Box>
        ) : error ? (
          <Typography variant="body2" sx={{ color: "#d32f2f", fontFamily: "'Inter', sans-serif" }}>
            {error}
          </Typography>
        ) : (
          <Typography variant="h4" sx={{ color: "#00C853", textAlign: "center", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            {balance !== null ? balance.toFixed(4) : "0.0000"} APT
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
