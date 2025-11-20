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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { backendApi } from "../services/backendApi";

interface BuyStockModalProps {
  open: boolean;
  onClose: () => void;
  onBuySuccess?: () => void;
}

// Stock symbols matching backend (GOOG, AAPL, TSLA, NVDA, HOOD)
const stocks = [
  { value: "GOOG", label: "Google (GOOG)" },
  { value: "AAPL", label: "Apple (AAPL)" },
  { value: "TSLA", label: "Tesla (TSLA)" },
  { value: "NVDA", label: "NVIDIA (NVDA)" },
  { value: "HOOD", label: "Robinhood (HOOD)" },
];

export default function BuyStockModal({ open, onClose, onBuySuccess }: BuyStockModalProps) {
  const { account } = useWallet();
  const [selectedStock, setSelectedStock] = useState("GOOG");
  const [currencyAmount, setCurrencyAmount] = useState<string>("");
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  const handleBuy = async () => {
    if (!account?.address || !currencyAmount) {
      setError("Please connect wallet and enter currency amount");
      return;
    }

    const currencyAmountNum = parseFloat(currencyAmount);

    if (currencyAmountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setBuying(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await backendApi.buyStock({
        userAddress: account.address.toString(),
        stock: selectedStock,
        amount: currencyAmountNum,
      });

      setSuccess(
        `Transaction succeeded! Bought ${result.stockAmount} ${selectedStock} for ${result.totalSpent} INR. Hash: ${result.txHash.substring(0, 10)}...`
      );
      setCurrencyAmount("");
      if (onBuySuccess) {
        onBuySuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to buy stock");
    } finally {
      setBuying(false);
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
          minWidth: 500,
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
          Buy Stock Coins
        </Typography>

        {/* Stock Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: "#666666" }}>Select Stock</InputLabel>
          <Select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            sx={{
              color: "#000000",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00C853" },
            }}
          >
            {stocks.map((stock) => (
              <MenuItem key={stock.value} value={stock.value}>
                {stock.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Currency Amount (INR) */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontWeight: 500 }}>
            Amount in INR
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={currencyAmount}
            onChange={(e) => setCurrencyAmount(e.target.value)}
            placeholder="0.00"
            disabled={buying}
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

        <Typography variant="body2" sx={{ color: "#999999", mb: 2, fontSize: '0.875rem' }}>
          Stock prices are fetched automatically from Yahoo Finance and converted to INR
        </Typography>

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
            onClick={handleBuy}
            disabled={buying || !account || !currencyAmount}
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
            {buying ? <CircularProgress size={20} sx={{ color: "#ffffff" }} /> : "Buy Stock"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
