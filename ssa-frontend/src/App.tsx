import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { Box, Container, Grid, Card, CardContent, Typography, Button, Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import WalletButton from "./components/Wallet";
import BalanceModal from "./components/BalanceModal";
import BuyStockModal from "./components/BuyStockModal";
import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { stockApi } from "./services/stockApi";
import type { StockQuote, StockData } from "./services/stockApi";
import { getAccountAPTBalance } from "./utils/getAccountBalance";
import { getINRBalance } from "./utils/getINRBalance";
import { getCNYBalance } from "./utils/getCNYBalance";
import { getEURBalance } from "./utils/getEURBalance";

const stocks = [
  { name: "Google", symbol: "GOOGC", alphaSymbol: "GOOGL" },
  { name: "Apple", symbol: "APPL", alphaSymbol: "AAPL" },
  { name: "Tesla", symbol: "TSLA", alphaSymbol: "TSLA" },
  { name: "NVIDIA", symbol: "NVDA", alphaSymbol: "NVDA" },
  { name: "Robinhood", symbol: "HOOD", alphaSymbol: "HOOD" },
];

// Main content component that uses the wallet
function MainContent() {
  const { account, connected } = useWallet();
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "INR" | "CNY" | "EUR">("USD");
  const [selectedStock, setSelectedStock] = useState(stocks[0]);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceCurrency, setBalanceCurrency] = useState<"APT" | "INR" | "CNY" | "EUR">("APT");
  const [buyStockModalOpen, setBuyStockModalOpen] = useState(false);
  const [exchangeRates] = useState({ INR: 83.5, USD: 1.0, CNY: 7.2, EUR: 0.92 });
  
  // Balance states
  const [aptBalance, setAptBalance] = useState<number | null>(null);
  const [inrBalance, setInrBalance] = useState<number | null>(null);
  const [cnyBalance, setCnyBalance] = useState<number | null>(null);
  const [eurBalance, setEurBalance] = useState<number | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  
  // Stock data states
  const [stockQuotes, setStockQuotes] = useState<Record<string, StockQuote>>({});
  const [intradayData, setIntradayData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logs
  useEffect(() => {
    console.log("Connected:", connected);
    console.log("Account:", account);
    console.log("Account address:", account?.address);
  }, [connected, account]);

  // Load stock prices
  useEffect(() => {
    const loadStockPrices = async () => {
      setLoading(true);
      setError(null);
      try {
        const quotes: Record<string, StockQuote> = {};
        for (const stock of stocks) {
          const quote = await stockApi.getStockQuote(stock.symbol);
          if (quote) {
            quotes[stock.symbol] = quote;
          }
        }
        if (Object.keys(quotes).length === 0) {
          setError("Unable to fetch stock data. Using fallback data.");
        }
        setStockQuotes(quotes);
      } catch (error: any) {
        console.error("Error loading stock prices:", error);
        setError(`Error loading stock prices: ${error.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    loadStockPrices();
    const interval = setInterval(loadStockPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Load intraday data when stock changes
  useEffect(() => {
    const loadIntradayData = async () => {
      const data = await stockApi.getIntradayData(selectedStock.symbol);
      setIntradayData(data);
    };
    loadIntradayData();
  }, [selectedStock]);

  // Load balances when wallet connects
  useEffect(() => {
    const loadBalances = async () => {
      console.log("=== Load Balances Effect ===");
      console.log("Connected:", connected);
      console.log("Account:", account);
      console.log("Account address:", account?.address?.toString());

      if (!connected || !account?.address) {
        console.log("No wallet connected or no address, clearing balances");
        setAptBalance(null);
        setInrBalance(null);
        setCnyBalance(null);
        setEurBalance(null);
        return;
      }

      setLoadingBalances(true);
      try {
        const addressString = account.address.toString();
        console.log("Loading balances for address:", addressString);
        
        // Load all balances in parallel
        const [apt, inr, cny, eur] = await Promise.all([
          getAccountAPTBalance({ accountAddress: addressString }).catch((e) => {
            console.error("APT balance error:", e);
            return 0;
          }),
          getINRBalance({ accountAddress: addressString }).catch((e) => {
            console.error("INR balance error:", e);
            return 0;
          }),
          getCNYBalance({ accountAddress: addressString }).catch((e) => {
            console.error("CNY balance error:", e);
            return 0;
          }),
          getEURBalance({ accountAddress: addressString }).catch((e) => {
            console.error("EUR balance error:", e);
            return 0;
          }),
        ]);

        console.log("Raw balances - APT:", apt, "INR:", inr, "CNY:", cny, "EUR:", eur);
        
        const convertedApt = apt / 100000000;
        const convertedInr = inr / Math.pow(10, 6);
        const convertedCny = cny / Math.pow(10, 6);
        const convertedEur = eur / Math.pow(10, 6);
        
        setAptBalance(convertedApt);
        setInrBalance(convertedInr);
        setCnyBalance(convertedCny);
        setEurBalance(convertedEur);
        
        console.log("Converted balances - APT:", convertedApt, "INR:", convertedInr, "CNY:", convertedCny, "EUR:", convertedEur);
      } catch (error) {
        console.error("Error loading balances:", error);
      } finally {
        setLoadingBalances(false);
      }
    };

    loadBalances();
    // Refresh balances every 30 seconds
    const interval = setInterval(loadBalances, 30000);
    return () => clearInterval(interval);
  }, [connected, account?.address]);

  const currentQuote = stockQuotes[selectedStock.symbol];
  const currentStockPrice = currentQuote?.price || 0;
  
  // Get the actual balance for selected currency
  const getCurrentBalance = (): number => {
    console.log("Getting current balance for currency:", selectedCurrency);
    console.log("Balances - APT:", aptBalance, "INR:", inrBalance, "CNY:", cnyBalance, "EUR:", eurBalance);
    
    if (selectedCurrency === "USD") {
      const balance = aptBalance ? aptBalance * exchangeRates.USD : 0;
      console.log("USD balance calculated:", balance);
      return balance;
    } else if (selectedCurrency === "INR") {
      console.log("INR balance:", inrBalance);
      return inrBalance || 0;
    } else if (selectedCurrency === "CNY") {
      console.log("CNY balance:", cnyBalance);
      return cnyBalance || 0;
    } else if (selectedCurrency === "EUR") {
      console.log("EUR balance:", eurBalance);
      return eurBalance || 0;
    }
    return 0;
  };

  const currentBalance = getCurrentBalance();
  const canBuy = currentStockPrice > 0 ? Math.floor(currentBalance / currentStockPrice) : 0;

  // Format chart data
  const chartData = intradayData.map((point) => ({
    time: new Date(point.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    price: point.price,
  }));

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#ffffff", py: 3 }}>
      <WalletButton />
      <Container maxWidth="xl">
        <Typography variant="h3" sx={{ mb: 4, textAlign: "center", fontWeight: 700, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
          TABDEEL
        </Typography>

        {/* Stock Prices - Front and Center */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ bgcolor: "#ffffff", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #e0e0e0" }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
                    Stock Prices
                  </Typography>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel sx={{ color: "#666666" }}>Select Stock</InputLabel>
                    <Select
                      value={selectedStock.symbol}
                      onChange={(e) => setSelectedStock(stocks.find(s => s.symbol === e.target.value) || stocks[0])}
                      sx={{
                        color: "#000000",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00C853" },
                      }}
                    >
                      {stocks.map((stock) => (
                        <MenuItem key={stock.symbol} value={stock.symbol}>
                          {stock.name} ({stock.alphaSymbol})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {error && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: "#fff3cd", borderRadius: 2, border: "1px solid #ffc107" }}>
                    <Typography sx={{ color: "#856404", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem" }}>
                      ⚠️ {error}
                    </Typography>
                  </Box>
                )}
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <Typography sx={{ color: "#666666", fontFamily: "'Inter', sans-serif" }}>Loading stock data...</Typography>
                  </Box>
                ) : currentQuote ? (
                  <>
                    <Box sx={{ mb: 4 }}>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 1 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: "#000000", fontFamily: "'Inter', sans-serif" }}>
                          ${currentQuote.price.toFixed(2)}
                        </Typography>
                        <Chip
                          label={`${currentQuote.change >= 0 ? "+" : ""}${currentQuote.change.toFixed(2)} (${currentQuote.changePercent >= 0 ? "+" : ""}${currentQuote.changePercent.toFixed(2)}%)`}
                          sx={{
                            bgcolor: currentQuote.change >= 0 ? "#e8f5e9" : "#ffebee",
                            color: currentQuote.change >= 0 ? "#2e7d32" : "#d32f2f",
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                      </Box>
                      <Typography variant="h6" sx={{ color: "#666666", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>
                        {selectedStock.name} ({currentQuote.symbol})
                      </Typography>
                    </Box>

                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="time" 
                            stroke="#999999"
                            tick={{ fill: "#666666", fontFamily: "'Inter', sans-serif" }}
                          />
                          <YAxis 
                            stroke="#999999"
                            tick={{ fill: "#666666", fontFamily: "'Inter', sans-serif" }}
                            domain={['dataMin - 1', 'dataMax + 1']}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #e0e0e0",
                              borderRadius: "8px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#00C853"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: "#00C853" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box sx={{ py: 4, textAlign: "center" }}>
                        <Typography sx={{ color: "#666666", fontFamily: "'Inter', sans-serif" }}>
                          No intraday data available. Market may be closed.
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ py: 8, textAlign: "center" }}>
                    <Typography sx={{ color: "#666666", fontFamily: "'Inter', sans-serif" }}>
                      Unable to load stock data. Please try again later.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: "#ffffff", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #e0e0e0" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
                  Buying Power
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel sx={{ color: "#666666" }}>Select Currency</InputLabel>
                  <Select
                    value={selectedCurrency}
                    onChange={(e) => {
                      const newCurrency = e.target.value as "USD" | "INR" | "CNY" | "EUR";
                      console.log("Currency changed to:", newCurrency);
                      setSelectedCurrency(newCurrency);
                      // Map currency to balance currency for modal
                      if (newCurrency === "USD") {
                        setBalanceCurrency("APT");
                      } else {
                        setBalanceCurrency(newCurrency);
                      }
                    }}
                    sx={{
                      color: "#000000",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00C853" },
                    }}
                  >
                    <MenuItem value="USD">USD (APT)</MenuItem>
                    <MenuItem value="INR">INR</MenuItem>
                    <MenuItem value="CNY">CNY</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                  </Select>
                </FormControl>

                {loadingBalances ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={24} sx={{ color: "#00C853" }} />
                  </Box>
                ) : (
                  <Typography variant="h5" sx={{ color: "#00C853", fontWeight: 600, mb: 3, fontFamily: "'Inter', sans-serif" }}>
                    {currentBalance.toFixed(selectedCurrency === "USD" ? 4 : 6)} {selectedCurrency}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ bgcolor: "#ffffff", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #e0e0e0" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
                  Purchase Stock Coins
                </Typography>
                <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontFamily: "'Inter', sans-serif" }}>
                    Current Price
                  </Typography>
                  <Typography variant="h5" sx={{ color: "#000000", fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                    ${currentStockPrice.toFixed(2)} {selectedCurrency}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontFamily: "'Inter', sans-serif" }}>
                    You can buy
                  </Typography>
                  <Typography variant="h6" sx={{ color: "#00C853", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    {canBuy} {selectedStock.symbol} coins
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setBuyStockModalOpen(true)}
                  sx={{
                    bgcolor: "#00C853",
                    color: "#ffffff",
                    textTransform: "none",
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    py: 1.5,
                    "&:hover": { bgcolor: "#00A043" },
                  }}
                >
                  Buy {selectedStock.symbol} Coins
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      <BalanceModal 
        open={balanceModalOpen} 
        onClose={() => setBalanceModalOpen(false)} 
        currency={balanceCurrency}
      />
      <BuyStockModal open={buyStockModalOpen} onClose={() => setBuyStockModalOpen(false)} />
    </Box>
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