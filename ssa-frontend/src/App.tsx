import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { Box, Container, Grid, Card, CardContent, Typography, TextField, InputAdornment, Avatar, Chip } from "@mui/material";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import WalletButton from "./components/Wallet";
import CurrencyHeader from "./components/CurrencyHeader";
import MintCurrencyModal from "./components/MintCurrencyModal";
import StockDetailView from "./components/StockDetailView";
import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { stockApi } from "./services/stockApi";
import type { StockQuote } from "./services/stockApi";
import { getAccountAPTBalance } from "./utils/getAccountBalance";
import { backendApi } from "./services/backendApi";

// Stock symbols matching backend (GOOG, AAPL, TSLA, NVDA, HOOD)
const stocks = [
  { name: "Google", symbol: "GOOG", logo: "https://logo.clearbit.com/google.com" },
  { name: "Apple", symbol: "AAPL", logo: "https://logo.clearbit.com/apple.com" },
  { name: "Tesla", symbol: "TSLA", logo: "https://logo.clearbit.com/tesla.com" },
  { name: "NVIDIA", symbol: "NVDA", logo: "https://logo.clearbit.com/nvidia.com" },
  { name: "Robinhood", symbol: "HOOD", logo: "https://logo.clearbit.com/robinhood.com" },
];

// Private market stocks (USDC-based)
const privateStocks = [
  { name: "Stripe", symbol: "STRIPE", logo: "https://logo.clearbit.com/stripe.com", price: 0.45 },
  { name: "OpenAI", symbol: "OPENAI", logo: "https://logo.clearbit.com/openai.com", price: 0.50 },
  { name: "Databricks", symbol: "DATABRICKS", logo: "https://logo.clearbit.com/databricks.com", price: 0.35 },
  { name: "SpaceX", symbol: "SPACEX", logo: "https://logo.clearbit.com/spacex.com", price: 0.40 },
];

// Dummy data for gainers and losers
const dummyGainers = [
  { name: "Amazon", symbol: "AMZN", price: 18500.50, changePercent: 4.25, logo: "https://logo.clearbit.com/amazon.com" },
  { name: "Meta", symbol: "META", price: 52340.80, changePercent: 3.12, logo: "https://logo.clearbit.com/meta.com" },
  { name: "Netflix", symbol: "NFLX", price: 63210.20, changePercent: 2.87, logo: "https://logo.clearbit.com/netflix.com" },
];

const dummyLosers = [
  { name: "AMD", symbol: "AMD", price: 12450.30, changePercent: -3.54, logo: "https://logo.clearbit.com/amd.com" },
  { name: "Intel", symbol: "INTC", price: 1980.60, changePercent: -2.89, logo: "https://logo.clearbit.com/intel.com" },
  { name: "Snap", symbol: "SNAP", price: 890.45, changePercent: -2.15, logo: "https://logo.clearbit.com/snap.com" },
];

// Home page component
function HomePage() {
  const { account, connected } = useWallet();
  const navigate = useNavigate();
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hardcoded exchange rates (1 USD = ...)
  const exchangeRates = { USD: 1.0, INR: 90.0, CNY: 7.2, EUR: 0.92 };

  // Balance states
  const [_aptBalance, setAptBalance] = useState<number | null>(null);
  const [inrBalance, setInrBalance] = useState<number | null>(null);
  const [_cnyBalance, setCnyBalance] = useState<number | null>(null);
  const [_eurBalance, setEurBalance] = useState<number | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Stock data states
  const [stockQuotes, setStockQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState(true);

  // Portfolio data state
  const [portfolioPositions, setPortfolioPositions] = useState<any[]>([]);

  // Load stock prices
  useEffect(() => {
    const loadStockPrices = async () => {
      setLoading(true);
      try {
        const quotes: Record<string, StockQuote> = {};
        for (const stock of stocks) {
          const quote = await stockApi.getStockQuote(stock.symbol);
          if (quote) {
            quotes[stock.symbol] = quote;
          }
        }
        setStockQuotes(quotes);
      } catch (error: any) {
        console.error("Error loading stock prices:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStockPrices();
    const interval = setInterval(loadStockPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load balances when wallet connects
  useEffect(() => {
    const loadBalances = async () => {
      if (!connected || !account?.address) {
        setAptBalance(null);
        setInrBalance(null);
        setCnyBalance(null);
        setEurBalance(null);
        return;
      }

      setLoadingBalances(true);
      try {
        const addressString = account.address.toString();

        const [apt, currencyBalances] = await Promise.all([
          getAccountAPTBalance({ accountAddress: addressString }).catch(() => 0),
          backendApi.getCurrencyBalances(addressString).catch(() => ({
            address: addressString,
            balances: { INR: 0, EUR: 0, CNY: 0 },
            formatted: { INR: "₹0.00", EUR: "€0.00", CNY: "¥0.00" },
          })),
        ]);

        setAptBalance(apt / 100000000);
        setInrBalance(currencyBalances.balances.INR);
        setCnyBalance(currencyBalances.balances.CNY);
        setEurBalance(currencyBalances.balances.EUR);
      } catch (error) {
        console.error("Error loading balances:", error);
      } finally {
        setLoadingBalances(false);
      }
    };

    loadBalances();
    const interval = setInterval(loadBalances, 30000);
    return () => clearInterval(interval);
  }, [connected, account?.address]);

  // Load portfolio data
  useEffect(() => {
    const loadPortfolio = async () => {
      if (!connected || !account?.address) {
        setPortfolioPositions([]);
        return;
      }

      try {
        const portfolioData = await backendApi.getPortfolio(account.address.toString());
        setPortfolioPositions(portfolioData.positions);
      } catch (error) {
        console.error("Error loading portfolio:", error);
      }
    };

    loadPortfolio();
    const interval = setInterval(loadPortfolio, 10000);
    return () => clearInterval(interval);
  }, [connected, account?.address]);

  const handleStockClick = (stockSymbol: string) => {
    navigate(`/stock/${stockSymbol}`);
  };

  const handleBalanceUpdate = () => {
    if (connected && account?.address) {
      backendApi.getCurrencyBalances(account.address.toString())
        .then((data) => {
          setInrBalance(data.balances.INR);
          setCnyBalance(data.balances.CNY);
          setEurBalance(data.balances.EUR);
        })
        .catch(console.error);
    }
  };

  // Filter stocks based on search
  const filteredStocks = stocks.filter(
    (stock) =>
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stock card component for all tokens
  const StockCard = ({ stock, quote }: { stock: typeof stocks[0]; quote?: StockQuote }) => {
    const priceInINR = (quote?.price || 0) * exchangeRates.INR;
    const changePercent = quote?.changePercent || 0;
    const isPositive = changePercent >= 0;

    return (
      <Card
        onClick={() => handleStockClick(stock.symbol)}
        sx={{
          cursor: "pointer",
          borderRadius: 3,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid #e8e8e8",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            borderColor: "#00C853",
          },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar
              src={stock.logo}
              sx={{ width: 44, height: 44, mr: 1.5, bgcolor: "#f5f5f5" }}
            >
              {stock.symbol[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif", lineHeight: 1.2 }}>
                {stock.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666", fontFamily: "'Inter', sans-serif" }}>
                {stock.symbol}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
              ₹{priceInINR.toFixed(2)}
            </Typography>
            <Chip
              icon={isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              label={`${isPositive ? "+" : ""}${changePercent.toFixed(2)}%`}
              size="small"
              sx={{
                bgcolor: isPositive ? "#e8f5e9" : "#ffebee",
                color: isPositive ? "#2e7d32" : "#d32f2f",
                fontWeight: 600,
                fontSize: "0.75rem",
                "& .MuiChip-icon": { color: "inherit" },
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Mini card for gainers/losers
  const MiniStockCard = ({ item, isDummy = false }: { item: any; isDummy?: boolean }) => {
    const isPositive = item.changePercent >= 0;

    return (
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          border: "1px solid #f0f0f0",
          opacity: isDummy ? 0.7 : 1,
        }}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src={item.logo}
              sx={{ width: 36, height: 36, mr: 1.5, bgcolor: "#f5f5f5" }}
            >
              {item.symbol[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                {item.symbol}
              </Typography>
              <Typography variant="caption" sx={{ color: "#999", fontFamily: "'Inter', sans-serif" }}>
                {item.name}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                ₹{item.price.toFixed(2)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isPositive ? "#2e7d32" : "#d32f2f",
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {isPositive ? "+" : ""}{item.changePercent.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fafafa", pb: 4 }}>
      <WalletButton />

      {/* Currency Balance Header */}
      {connected && (
        <CurrencyHeader
          balance={inrBalance}
          loading={loadingBalances}
          onClick={() => setMintModalOpen(true)}
        />
      )}

      {/* Mint Currency Modal */}
      <MintCurrencyModal
        open={mintModalOpen}
        onClose={() => setMintModalOpen(false)}
        onBalanceUpdate={handleBalanceUpdate}
      />

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#1a1a1a",
              fontFamily: "'Poppins', sans-serif",
              mb: 1,
            }}
          >
            TABDEEL
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", fontFamily: "'Inter', sans-serif" }}>
            Trade tokenized stocks on the blockchain
          </Typography>
        </Box>

        {/* Connect Wallet Prompt */}
        {!connected && (
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 2,
              background: "linear-gradient(135deg, #00C853 0%, #00E676 100%)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Wallet size={32} color="#fff" />
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ color: "#fff", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
              >
                Connect Your Wallet
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Inter', sans-serif" }}>
                Start trading tokenized stocks on Aptos
              </Typography>
            </Box>
          </Box>
        )}

        {/* Gainers and Losers Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Top Gainers */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
              <TrendingUp size={24} color="#2e7d32" style={{ marginRight: 8 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                Top Gainers
              </Typography>
              <Chip label="Coming Soon" size="small" sx={{ ml: 1, bgcolor: "#e8f5e9", color: "#2e7d32" }} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {dummyGainers.map((item) => (
                <MiniStockCard key={item.symbol} item={item} isDummy />
              ))}
            </Box>
          </Grid>

          {/* Top Losers */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
              <TrendingDown size={24} color="#d32f2f" style={{ marginRight: 8 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                Top Losers
              </Typography>
              <Chip label="Coming Soon" size="small" sx={{ ml: 1, bgcolor: "#ffebee", color: "#d32f2f" }} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {dummyLosers.map((item) => (
                <MiniStockCard key={item.symbol} item={item} isDummy />
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Portfolio Section - Only when connected */}
        {connected && portfolioPositions.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
                Your Portfolio
              </Typography>
              <Chip
                label={`${portfolioPositions.length} holdings`}
                size="small"
                sx={{ ml: 1.5, bgcolor: "#e3f2fd", color: "#1976d2", fontWeight: 500 }}
              />
            </Box>
            <Grid container spacing={2}>
              {portfolioPositions.map((pos) => {
                const isPositive = pos.unrealizedPnl >= 0;
                const stockData = stocks.find((s) => s.symbol === pos.stockSymbol);
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pos.stockSymbol}>
                    <Card
                      onClick={() => handleStockClick(pos.stockSymbol)}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 2,
                        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                        border: "1px solid #f0f0f0",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "#00C853",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                          <Avatar
                            src={stockData?.logo}
                            sx={{ width: 36, height: 36, mr: 1.5, bgcolor: "#f5f5f5" }}
                          >
                            {pos.stockSymbol[0]}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                              {pos.stockSymbol}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#999" }}>
                              {pos.currentQuantity.toFixed(4)} shares
                            </Typography>
                          </Box>
                          <Chip
                            label={`${isPositive ? "+" : ""}${pos.unrealizedPnlPercent?.toFixed(2) || "0.00"}%`}
                            size="small"
                            sx={{
                              bgcolor: isPositive ? "#e8f5e9" : "#ffebee",
                              color: isPositive ? "#2e7d32" : "#d32f2f",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: "#999", display: "block" }}>
                              Invested
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                              ₹{pos.totalCostBasis.toFixed(2)}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="caption" sx={{ color: "#999", display: "block" }}>
                              Current
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif", color: isPositive ? "#2e7d32" : "#d32f2f" }}>
                              ₹{pos.currentValue.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Private Market Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
              Private Market
            </Typography>
            <Chip
              label="USDC"
              size="small"
              sx={{ ml: 1.5, bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 600 }}
            />
          </Box>
          <Grid container spacing={2}>
            {privateStocks.map((stock) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stock.symbol}>
                <Card
                  onClick={() => handleStockClick(stock.symbol)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 3,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #e3f2fd",
                    background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(21, 101, 192, 0.15)",
                      borderColor: "#1565c0",
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar
                        src={stock.logo}
                        sx={{ width: 44, height: 44, mr: 1.5, bgcolor: "#f5f5f5" }}
                      >
                        {stock.symbol[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif", lineHeight: 1.2 }}>
                          {stock.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#666", fontFamily: "'Inter', sans-serif" }}>
                          {stock.symbol}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Inter', sans-serif", color: "#1565c0" }}>
                        ${stock.price.toFixed(2)}
                      </Typography>
                      <Chip
                        label="USDC"
                        size="small"
                        sx={{
                          bgcolor: "#e3f2fd",
                          color: "#1565c0",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* All Tokens Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
              Public Market
            </Typography>
            <TextField
              size="small"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="#999" />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 250,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#fff",
                  "& fieldset": { borderColor: "#e0e0e0" },
                  "&:hover fieldset": { borderColor: "#00C853" },
                  "&.Mui-focused fieldset": { borderColor: "#00C853" },
                },
              }}
            />
          </Box>

          {loading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography sx={{ color: "#666" }}>Loading tokens...</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredStocks.map((stock) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={stock.symbol}>
                  <StockCard stock={stock} quote={stockQuotes[stock.symbol]} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  );
}

// Main content with routing
function MainContent() {
  const { account } = useWallet();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/stock/:stock" element={<StockDetailView walletAddress={account?.address?.toString()} />} />
    </Routes>
  );
}

// App component with provider
export default function App() {
  return (
    <AptosWalletAdapterProvider autoConnect={true} dappConfig={{ network: Network.TESTNET }}>
      <MainContent />
    </AptosWalletAdapterProvider>
  );
}
