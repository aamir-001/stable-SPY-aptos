import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { backendApi } from "../services/backendApi";

interface SellStockModalProps {
  open: boolean;
  onClose: () => void;
  currentStock: string;
  currentBalance: number;
  onSellSuccess?: () => void;
}

const stocks = [
  { value: "GOOG", label: "Google (GOOG)" },
  { value: "AAPL", label: "Apple (AAPL)" },
  { value: "TSLA", label: "Tesla (TSLA)" },
  { value: "NVDA", label: "NVIDIA (NVDA)" },
  { value: "HOOD", label: "Robinhood (HOOD)" },
];

export default function SellStockModal({
  open,
  onClose,
  currentStock,
  currentBalance,
  onSellSuccess
}: SellStockModalProps) {
  const { account, connected } = useWallet();
  const [selectedStock, setSelectedStock] = useState(currentStock);
  const [amount, setAmount] = useState("");
  const [selling, setSelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSell = async () => {
    if (!account?.address || !amount) {
      setError("Please enter an amount");
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (amountNum > currentBalance) {
      setError(`You only have ${currentBalance.toFixed(6)} ${selectedStock} coins`);
      return;
    }

    setSelling(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await backendApi.sellStock({
        userAddress: account.address.toString(),
        stock: selectedStock,
        amount: amountNum,
      });

      setSuccess(
        `Successfully sold ${result.stocksSold} ${selectedStock} for ₹${result.totalReceived.toFixed(2)}!`
      );
      setAmount("");
      if (onSellSuccess) {
        onSellSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to sell stock");
    } finally {
      setSelling(false);
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
          Sell Stock Coins
        </Typography>

        {/* Stock Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: "#666666" }}>Select Stock</InputLabel>
          <Select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            disabled={selling}
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

        {/* Current Balance */}
        <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: "#666666", mb: 0.5 }}>
            Your Balance
          </Typography>
          <Typography variant="h6" sx={{ color: "#00C853", fontWeight: 600 }}>
            {currentBalance.toFixed(6)} {selectedStock}
          </Typography>
        </Box>

        {/* Amount Input */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontWeight: 500 }}>
            Amount to Sell (in {selectedStock} tokens)
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.000000"
            disabled={selling || !connected}
            inputProps={{
              step: "0.000001",
              min: "0",
            }}
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
            fullWidth
            sx={{
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
            onClick={handleSell}
            disabled={selling || !connected || !amount || parseFloat(amount) <= 0}
            fullWidth
            sx={{
              bgcolor: "#d32f2f",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              "&:hover": { bgcolor: "#b71c1c" },
              "&:disabled": { bgcolor: "#e0e0e0", color: "#bdbdbd" },
            }}
          >
            {selling ? <CircularProgress size={20} sx={{ color: "#ffffff" }} /> : "Sell Stock"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
