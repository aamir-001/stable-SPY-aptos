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
import { mockApi } from "../services/mockApi";

interface BuyStockModalProps {
  open: boolean;
  onClose: () => void;
}

const currencies = [
  { value: "INR", label: "INR" },
  { value: "CNY", label: "CNY" },
  { value: "EUR", label: "EUR" },
];

const stocks = [
  { value: "GOOGC", label: "Google (GOOGC)" },
  { value: "APPL", label: "Apple (APPL)" },
  { value: "TSLA", label: "Tesla (TSLA)" },
  { value: "NVDA", label: "NVIDIA (NVDA)" },
  { value: "HOOD", label: "Robinhood (HOOD)" },
];

export default function BuyStockModal({ open, onClose }: BuyStockModalProps) {
  const { account } = useWallet();
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [selectedStock, setSelectedStock] = useState("GOOGC");
  const [currencyAmount, setCurrencyAmount] = useState<string>("");
  const [stockPrice, setStockPrice] = useState<string>("");
  const [buying, setBuying] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stockAmount, setStockAmount] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(null);
      setStockAmount(null);
    }
  }, [open]);

  const handleCalculate = async () => {
    if (!currencyAmount || !stockPrice) {
      setError("Please enter both currency amount and stock price");
      return;
    }

    const currencyAmountNum = parseFloat(currencyAmount);
    const priceNum = parseFloat(stockPrice);

    if (currencyAmountNum <= 0 || priceNum <= 0) {
      setError("Amounts must be greater than 0");
      return;
    }

    setCalculating(true);
    setError(null);

    try {
      // Convert to smallest units (6 decimals)
      const currencyAmountSmallest = Math.floor(currencyAmountNum * Math.pow(10, 6));
      const priceSmallest = Math.floor(priceNum * Math.pow(10, 6));

      const amount = await mockApi.calculateBuyAmount(currencyAmountSmallest, priceSmallest);
      setStockAmount(amount / Math.pow(10, 6)); // Convert back to readable format
    } catch (err: any) {
      setError(err.message || "Failed to calculate stock amount");
    } finally {
      setCalculating(false);
    }
  };

  const handleBuy = async () => {
    if (!account?.address || !currencyAmount || !stockPrice) {
      setError("Please fill in all fields");
      return;
    }

    const currencyAmountNum = parseFloat(currencyAmount);
    const priceNum = parseFloat(stockPrice);

    if (currencyAmountNum <= 0 || priceNum <= 0) {
      setError("Amounts must be greater than 0");
      return;
    }

    setBuying(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert to smallest units (6 decimals)
      const currencyAmountSmallest = Math.floor(currencyAmountNum * Math.pow(10, 6));
      const priceSmallest = Math.floor(priceNum * Math.pow(10, 6));

      const result = await mockApi.buyStock(
        account.address.toString(),
        selectedCurrency,
        selectedStock,
        currencyAmountSmallest,
        priceSmallest
      );

      setSuccess(`Transaction succeeded! Hash: ${result.hash}`);
      setCurrencyAmount("");
      setStockPrice("");
      setStockAmount(null);
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

        {/* Currency Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: "#666666" }}>Select Currency</InputLabel>
          <Select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            sx={{
              color: "#000000",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00C853" },
            }}
          >
            {currencies.map((curr) => (
              <MenuItem key={curr.value} value={curr.value}>
                {curr.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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

        {/* Currency Amount */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontWeight: 500 }}>
            Currency Amount ({selectedCurrency})
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

        {/* Stock Price */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontWeight: 500 }}>
            Stock Price ({selectedCurrency} per {selectedStock})
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={stockPrice}
            onChange={(e) => setStockPrice(e.target.value)}
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

        {/* Calculate Button */}
        <Button
          variant="outlined"
          fullWidth
          onClick={handleCalculate}
          disabled={calculating || !currencyAmount || !stockPrice}
          sx={{
            mb: 2,
            borderColor: "#00C853",
            color: "#00C853",
            textTransform: "none",
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            "&:hover": { borderColor: "#00A043", bgcolor: "rgba(0, 200, 83, 0.05)" },
            "&:disabled": { borderColor: "#e0e0e0", color: "#bdbdbd" },
          }}
        >
          {calculating ? <CircularProgress size={20} sx={{ color: "#00C853" }} /> : "Calculate Stock Amount"}
        </Button>

        {/* Stock Amount Display */}
        {stockAmount !== null && (
          <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: "#666666", mb: 1 }}>
              You will receive:
            </Typography>
            <Typography variant="h5" sx={{ color: "#00C853", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
              {stockAmount.toFixed(6)} {selectedStock}
            </Typography>
          </Box>
        )}

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
            disabled={buying || !account || !currencyAmount || !stockPrice || stockAmount === null}
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
