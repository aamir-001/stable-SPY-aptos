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
import { AccountBalanceWallet, AddCircleOutline } from "@mui/icons-material";
import { backendApi } from "../services/backendApi";

interface MintCurrencyModalProps {
  open: boolean;
  onClose: () => void;
  onBalanceUpdate?: () => void;
}

export default function MintCurrencyModal({ open, onClose, onBalanceUpdate }: MintCurrencyModalProps) {
  const { account, connected } = useWallet();
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
      const bal = await backendApi.getCurrencyBalance('INR', account.address.toString());
      setBalance(bal);
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

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setMinting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await backendApi.mintCurrency({
        currency: 'INR',
        userAddress: account.address.toString(),
        amount: amountNum,
      });
      setSuccess(`Successfully minted ₹${result.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`);
      setAmount("");
      await fetchBalance(); // Refresh balance
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }
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
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: "2px solid #00C853",
          minWidth: 500,
          maxWidth: 500,
        },
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "#00C853",
              color: "#ffffff",
            }}
          >
            <AccountBalanceWallet sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
              Buy INR Coins
            </Typography>
            <Typography variant="body2" sx={{ color: "#666666", fontFamily: "'Inter', sans-serif" }}>
              Mint new currency coins to your wallet
            </Typography>
          </Box>
        </Box>

        {/* Current Balance Display */}
        <Box sx={{ mb: 3, p: 3, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #00C853" }}>
          <Typography variant="caption" sx={{ color: "#666666", mb: 1, fontWeight: 500, display: "block" }}>
            Current Balance
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} sx={{ color: "#00C853" }} />
            </Box>
          ) : (
            <Typography variant="h4" sx={{ color: "#00C853", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
              ₹{balance !== null ? balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </Typography>
          )}
        </Box>

        {/* Mint Amount Input */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: "#000000", mb: 1.5, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
            Amount to Mint
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount in INR"
            disabled={minting || !connected}
            InputProps={{
              startAdornment: (
                <Typography sx={{ mr: 1, color: "#666666", fontWeight: 600 }}>₹</Typography>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#000000",
                fontSize: "1.1rem",
                fontWeight: 500,
                "& fieldset": { borderColor: "#e0e0e0", borderWidth: 2 },
                "&:hover fieldset": { borderColor: "#00C853" },
                "&.Mui-focused fieldset": { borderColor: "#00C853", borderWidth: 2 },
              },
            }}
          />
          <Typography variant="caption" sx={{ color: "#666666", mt: 1, display: "block" }}>
            Minimum amount: ₹1.00
          </Typography>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              bgcolor: "#ffebee",
              color: "#d32f2f",
              borderRadius: 2,
              "& .MuiAlert-icon": { color: "#d32f2f" }
            }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              bgcolor: "#e8f5e9",
              color: "#2e7d32",
              borderRadius: 2,
              "& .MuiAlert-icon": { color: "#2e7d32" }
            }}
          >
            {success}
          </Alert>
        )}

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            fullWidth
            sx={{
              borderColor: "#e0e0e0",
              borderWidth: 2,
              color: "#666666",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
              py: 1.5,
              fontFamily: "'Inter', sans-serif",
              "&:hover": {
                borderColor: "#bdbdbd",
                borderWidth: 2,
                bgcolor: "#f5f5f5"
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleMint}
            disabled={minting || !connected || !amount || parseFloat(amount) <= 0}
            fullWidth
            startIcon={minting ? null : <AddCircleOutline />}
            sx={{
              bgcolor: "#00C853",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "1rem",
              py: 1.5,
              fontFamily: "'Inter', sans-serif",
              "&:hover": { bgcolor: "#00A043" },
              "&:disabled": { bgcolor: "#e0e0e0", color: "#bdbdbd" },
            }}
          >
            {minting ? <CircularProgress size={24} sx={{ color: "#ffffff" }} /> : "Mint Coins"}
          </Button>
        </Box>

        {!connected && (
          <Typography variant="caption" sx={{ color: "#d32f2f", mt: 2, display: "block", textAlign: "center" }}>
            Please connect your wallet to mint coins
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
