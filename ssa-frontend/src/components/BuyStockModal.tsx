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
import { buyStock } from "../utils/buyStock";
import { calculateBuyAmount } from "../utils/calculateBuyAmount";
import { aptosClient } from "../utils/aptosClient";

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
  const { account, signAndSubmitTransaction } = useWallet();
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

      const amount = await calculateBuyAmount({
        currencyAmount: currencyAmountSmallest,
        priceInCurrency: priceSmallest,
      });

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

      const committedTransaction = await signAndSubmitTransaction(
        buyStock({
          user: account.address.toString(),
          currency: selectedCurrency,
          stock: selectedStock,
          currencyAmount: currencyAmountSmallest,
          priceInCurrency: priceSmallest,
        })
      );

      const executedTransaction = await aptosClient().waitForTransaction({
        transactionHash: committedTransaction.hash,
      });

      setSuccess(`Transaction succeeded! Hash: ${executedTransaction.hash}`);
      setCurrencyAmount("");
      setStockPrice("");
      setStockAmount(null);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to buy stock";
      if (errorMsg.includes("E_NOT_ADMIN") || errorMsg.includes("NOT_ADMIN")) {
        setError("Only the contract admin can execute this transaction. Please use the admin wallet.");
      } else {
        setError(errorMsg);
      }
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
          bgcolor: "#1a1a1a",
          borderRadius: 3,
          boxShadow: "0 0 2px #888",
          minWidth: 450,
        },
      }}
    >
      <DialogContent>
        <Typography variant="h6" sx={{ mb: 3, color: "#FF8C42" }}>
          Buy Stock Coins
        </Typography>

        {/* Currency Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: "#fff" }}>Select Currency</InputLabel>
          <Select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            sx={{ color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#444" } }}
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
          <InputLabel sx={{ color: "#fff" }}>Select Stock</InputLabel>
          <Select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            sx={{ color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#444" } }}
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
          <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
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
                color: "#fff",
                "& fieldset": { borderColor: "#444" },
                "&:hover fieldset": { borderColor: "#FF8C42" },
                "&.Mui-focused fieldset": { borderColor: "#FF8C42" },
              },
            }}
          />
        </Box>

        {/* Stock Price */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
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
                color: "#fff",
                "& fieldset": { borderColor: "#444" },
                "&:hover fieldset": { borderColor: "#FF8C42" },
                "&.Mui-focused fieldset": { borderColor: "#FF8C42" },
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
            borderColor: "#FF8C42",
            color: "#FF8C42",
            "&:hover": { borderColor: "#FF7A2E", bgcolor: "rgba(255, 140, 66, 0.1)" },
            "&:disabled": { borderColor: "#444", color: "#888" },
          }}
        >
          {calculating ? <CircularProgress size={20} sx={{ color: "#FF8C42" }} /> : "Calculate Stock Amount"}
        </Button>

        {/* Stock Amount Display */}
        {stockAmount !== null && (
          <Box sx={{ mb: 2, p: 2, bgcolor: "#2a2a2a", borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
              You will receive:
            </Typography>
            <Typography variant="h5" sx={{ color: "#FF8C42" }}>
              {stockAmount.toFixed(6)} {selectedStock}
            </Typography>
          </Box>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: "#2a1a1a", color: "#ff4444" }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, bgcolor: "#1a2a1a", color: "#44ff44" }}>
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
              borderColor: "#444",
              color: "#fff",
              "&:hover": { borderColor: "#666" },
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
              bgcolor: "#FF8C42",
              "&:hover": { bgcolor: "#FF7A2E" },
              "&:disabled": { bgcolor: "#444", color: "#888" },
            }}
          >
            {buying ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Buy Stock"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

