import { Box, Typography, CircularProgress } from "@mui/material";
import { AccountBalanceWallet } from "@mui/icons-material";

interface CurrencyHeaderProps {
  balance: number | null;
  loading: boolean;
  onClick: () => void;
}

export default function CurrencyHeader({ balance, loading, onClick }: CurrencyHeaderProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        bgcolor: "#ffffff",
        border: "2px solid #00C853",
        borderRadius: 3,
        px: 3,
        py: 1.5,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,200,83,0.2)",
        transition: "all 0.3s ease",
        "&:hover": {
          bgcolor: "#f0fdf4",
          boxShadow: "0 6px 16px rgba(0,200,83,0.3)",
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* Currency Logo/Icon */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          bgcolor: "#00C853",
          color: "#ffffff",
        }}
      >
        <AccountBalanceWallet sx={{ fontSize: 24 }} />
      </Box>

      {/* Balance Details */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "#666666",
            fontWeight: 500,
            fontSize: "0.75rem",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          INR Balance
        </Typography>
        {loading ? (
          <Box display="flex" alignItems="center" sx={{ mt: 0.5 }}>
            <CircularProgress size={16} sx={{ color: "#00C853" }} />
          </Box>
        ) : (
          <Typography
            variant="h6"
            sx={{
              color: "#00C853",
              fontWeight: 700,
              fontSize: "1.1rem",
              fontFamily: "'Poppins', sans-serif",
              lineHeight: 1.2,
            }}
          >
            ₹{balance !== null ? balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
