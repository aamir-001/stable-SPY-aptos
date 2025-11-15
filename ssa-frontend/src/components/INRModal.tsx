import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  TextField,
  Alert,
} from "@mui/material";
import { mockApi } from "../services/mockApi";

interface INRModalProps {
  open: boolean;
  onClose: () => void;
}

export default function INRModal({ open, onClose }: INRModalProps) {
  const { account } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    if (open && account?.address) {
      fetchBalance();
    }
  }, [open, account?.address]);

  const fetchBalance = async () => {
    if (!account?.address) return;
    setLoading(true);
    setError(null);
    try {
      const bal = await mockApi.getINRBalance(account.address.toString());
      setBalance(bal / Math.pow(10, 6)); // Convert from smallest unit (6 decimals) to INR
    } catch (err: any) {
      setError(err.message || "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!account?.address || !amount) {
      setError("Please enter an amount");
      return;
    }

    const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, 6));
    if (amountInSmallestUnit <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setMinting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await mockApi.mintINR(account.address.toString(), amountInSmallestUnit);
      setSuccess(`Transaction succeeded! Hash: ${result.hash}`);
      setAmount("");
      await fetchBalance(); // Refresh balance
    } catch (err: any) {
      setError(err.message || "Failed to mint INR");
    } finally {
      setMinting(false);
    }
  };

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
          minWidth: 450,
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
          INR Coin
        </Typography>

        {/* Balance Display */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontWeight: 500 }}>
            Your INR Balance
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} sx={{ color: "#00C853" }} />
            </Box>
          ) : (
            <Typography variant="h4" sx={{ color: "#00C853", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
              {balance !== null ? balance.toFixed(6) : "0.000000"} INR
            </Typography>
          )}
        </Box>

        {/* Mint Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontWeight: 500 }}>
            Amount to Mint (INR)
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={minting || !account}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#000000",
                "& fieldset": { borderColor: "#e0e0e0" },
                "&:hover fieldset": { borderColor: "#00C853" },
                "&.Mui-focused fieldset": { borderColor: "#00C853" },
              },
            }}
          />
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: "#ffebee", color: "#d32f2f" }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, bgcolor: "#e8f5e9", color: "#2e7d32" }}>
            {success}
          </Alert>
        )}

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              flex: 1,
              borderColor: "#e0e0e0",
              color: "#666666",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { borderColor: "#bdbdbd", bgcolor: "#f5f5f5" },
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleMint}
            disabled={minting || !account || !amount}
            sx={{
              flex: 1,
              bgcolor: "#00C853",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              "&:hover": { bgcolor: "#00A043" },
              "&:disabled": { bgcolor: "#e0e0e0", color: "#bdbdbd" },
            }}
          >
            {minting ? <CircularProgress size={20} sx={{ color: "#ffffff" }} /> : "Mint INR"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
