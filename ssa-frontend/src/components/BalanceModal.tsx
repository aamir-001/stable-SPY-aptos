import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Dialog, DialogContent, Typography, Box, CircularProgress } from "@mui/material";
import { getAccountAPTBalance } from "../utils/getAccountBalance";
import { getINRBalance } from "../utils/getINRBalance";
import { getCNYBalance } from "../utils/getCNYBalance";
import { getEURBalance } from "../utils/getEURBalance";

interface BalanceModalProps {
  open: boolean;
  onClose: () => void;
  currency: "APT" | "INR" | "CNY" | "EUR";
}

export default function BalanceModal({ open, onClose, currency }: BalanceModalProps) {
  const { account } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && account?.address) {
      setLoading(true);
      setError(null);
      
      const fetchBalance = async () => {
        try {
          let bal: number;
          
          if (currency === "APT") {
            bal = await getAccountAPTBalance({ accountAddress: account.address.toString() });
            setBalance(bal / 100000000); // Convert from octas to APT
          } else if (currency === "INR") {
            bal = await getINRBalance({ accountAddress: account.address.toString() });
            setBalance(bal / Math.pow(10, 6)); // Convert from smallest unit (6 decimals) to INR
          } else if (currency === "CNY") {
            bal = await getCNYBalance({ accountAddress: account.address.toString() });
            setBalance(bal / Math.pow(10, 6)); // Convert from smallest unit (6 decimals) to CNY
          } else if (currency === "EUR") {
            bal = await getEURBalance({ accountAddress: account.address.toString() });
            setBalance(bal / Math.pow(10, 6)); // Convert from smallest unit (6 decimals) to EUR
          } else {
            setBalance(0);
          }
        } catch (err: any) {
          setError(err.message || "Failed to fetch balance");
        } finally {
          setLoading(false);
        }
      };

      fetchBalance();
    }
  }, [open, account?.address, currency]);

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
          {currency} Balance
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
            {balance !== null ? balance.toFixed(currency === "APT" ? 4 : 6) : "0.000000"} {currency}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
