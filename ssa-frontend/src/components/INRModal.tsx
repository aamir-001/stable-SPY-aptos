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
import { getINRBalance } from "../utils/getINRBalance";
import { mintINR } from "../utils/mintINR";
import { aptosClient } from "../utils/aptosClient";

interface INRModalProps {
  open: boolean;
  onClose: () => void;
}

export default function INRModal({ open, onClose }: INRModalProps) {
  const { account, signAndSubmitTransaction } = useWallet();
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
      const bal = await getINRBalance({ accountAddress: account.address.toString() });
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
      const committedTransaction = await signAndSubmitTransaction(
        mintINR({
          to: account.address.toString(),
          amount: amountInSmallestUnit,
        })
      );

      const executedTransaction = await aptosClient().waitForTransaction({
        transactionHash: committedTransaction.hash,
      });

      setSuccess(`Transaction succeeded! Hash: ${executedTransaction.hash}`);
      setAmount("");
      await fetchBalance(); // Refresh balance
    } catch (err: any) {
      const errorMsg = err.message || "Failed to mint INR";
      if (errorMsg.includes("E_NOT_ADMIN") || errorMsg.includes("NOT_ADMIN")) {
        setError("Only the contract admin can mint INR coins. Please use the admin wallet address: 0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d");
      } else {
        setError(errorMsg);
      }
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
          bgcolor: "#1a1a1a",
          borderRadius: 3,
          boxShadow: "0 0 2px #888",
          minWidth: 400,
        },
      }}
    >
      <DialogContent>
        <Typography variant="h6" sx={{ mb: 3, color: "#FF8C42" }}>
          INR Coin
        </Typography>

        {/* Balance Display */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
            Your INR Balance
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} sx={{ color: "#FF8C42" }} />
            </Box>
          ) : (
            <Typography variant="h4" sx={{ color: "#fff" }}>
              {balance !== null ? balance.toFixed(6) : "0.000000"} INR
            </Typography>
          )}
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 2, bgcolor: "#1a2a3a", color: "#88ccff" }}>
          Note: Only the contract admin can mint INR coins. Regular users cannot mint directly.
        </Alert>

        {/* Mint Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#888", mb: 1 }}>
            Amount to Mint (INR) - Admin Only
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
                color: "#fff",
                "& fieldset": { borderColor: "#444" },
                "&:hover fieldset": { borderColor: "#FF8C42" },
                "&.Mui-focused fieldset": { borderColor: "#FF8C42" },
              },
            }}
          />
        </Box>

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
            onClick={handleMint}
            disabled={minting || !account || !amount}
            sx={{
              flex: 1,
              bgcolor: "#FF8C42",
              "&:hover": { bgcolor: "#FF7A2E" },
              "&:disabled": { bgcolor: "#444", color: "#888" },
            }}
          >
            {minting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Mint INR"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

