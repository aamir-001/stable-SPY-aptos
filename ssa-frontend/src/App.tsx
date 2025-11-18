import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { Box, Container, Grid, Card, CardContent, Typography, Button, Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import WalletButton from "./components/Wallet";
import BalanceModal from "./components/BalanceModal";
import BuyStockModal from "./components/BuyStockModal";
import SellStockModal from "./components/SellStockModal";
import CurrencyHeader from "./components/CurrencyHeader";
import MintCurrencyModal from "./components/MintCurrencyModal";
import PortfolioView from "./components/PortfolioView";
import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { stockApi } from "./services/stockApi";
import type { StockQuote, StockData } from "./services/stockApi";
import { getAccountAPTBalance } from "./utils/getAccountBalance";
import { backendApi } from "./services/backendApi";

// Stock symbols matching backend (GOOG, AAPL, TSLA, NVDA, HOOD)
const stocks = [
  { name: "Google", symbol: "GOOG", alphaSymbol: "GOOGL" },
  { name: "Apple", symbol: "AAPL", alphaSymbol: "AAPL" },
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
  const [sellStockModalOpen, setSellStockModalOpen] = useState(false);
  const [mintModalOpen, setMintModalOpen] = useState(false);
  
  // Hardcoded exchange rates (1 USD = ...)
  const exchangeRates = { USD: 1.0, INR: 90.0, CNY: 7.2, EUR: 0.92 };

  // Balance states
  const [aptBalance, setAptBalance] = useState<number | null>(null);
  const [inrBalance, setInrBalance] = useState<number | null>(null);
  const [cnyBalance, setCnyBalance] = useState<number | null>(null);
  const [eurBalance, setEurBalance] = useState<number | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Stock balance state
  const [stockBalance, setStockBalance] = useState<number>(0);
  const [loadingStockBalance, setLoadingStockBalance] = useState(false);
  
  // Stock data states
  const [stockQuotes, setStockQuotes] = useState<Record<string, StockQuote>>({});
  const [intradayData, setIntradayData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Portfolio holdings state
  const [portfolioHoldings, setPortfolioHoldings] = useState<any[]>([]);

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

        // Load all balances using backend API
        const [apt, currencyBalances] = await Promise.all([
          getAccountAPTBalance({ accountAddress: addressString }).catch((e) => {
            console.error("APT balance error:", e);
            return 0;
          }),
          backendApi.getCurrencyBalances(addressString).catch((e) => {
            console.error("Currency balances error:", e);
            return { address: addressString, balances: { INR: 0, EUR: 0, CNY: 0 }, formatted: { INR: "₹0.00", EUR: "€0.00", CNY: "¥0.00" } };
          }),
        ]);

        console.log("Balances - APT:", apt, "Currencies:", currencyBalances);

        const convertedApt = apt / 100000000;

        setAptBalance(convertedApt);
        setInrBalance(currencyBalances.balances.INR);
        setCnyBalance(currencyBalances.balances.CNY);
        setEurBalance(currencyBalances.balances.EUR);

        console.log("Converted balances - APT:", convertedApt, "INR:", currencyBalances.balances.INR, "CNY:", currencyBalances.balances.CNY, "EUR:", currencyBalances.balances.EUR);
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

  // Load stock balance when wallet connects or stock changes, and poll every 5 seconds
  useEffect(() => {
    const loadStockBalance = async () => {
      if (!connected || !account?.address) {
        setStockBalance(0);
        return;
      }

      setLoadingStockBalance(true);
      try {
        const balance = await backendApi.getStockBalance(selectedStock.symbol, account.address.toString());
        setStockBalance(balance);
      } catch (error) {
        console.error("Error loading stock balance:", error);
        setStockBalance(0);
      } finally {
        setLoadingStockBalance(false);
      }
    };

    loadStockBalance();

    // Auto-refresh stock balance every 5 seconds
    const interval = setInterval(loadStockBalance, 5000);
    return () => clearInterval(interval);
  }, [connected, account?.address, selectedStock.symbol]);

  // Load portfolio holdings
  useEffect(() => {
    const loadPortfolioHoldings = async () => {
      if (!connected || !account?.address) {
        setPortfolioHoldings([]);
        return;
      }

      try {
        const holdingsData = await Promise.all(
          stocks.map(async (stock) => {
            const balance = await backendApi.getStockBalance(
              stock.symbol, 
              account.address.toString()
            ).catch(() => 0);
            
            const quote = stockQuotes[stock.symbol];
            
            return {
              symbol: stock.symbol,
              name: stock.name,
              alphaSymbol: stock.alphaSymbol,
              balance: balance,
              currentPrice: quote?.price || 0,
              value: balance * (quote?.price || 0),
              change: quote?.change,
              changePercent: quote?.changePercent,
            };
          })
        );
        
        setPortfolioHoldings(holdingsData);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }
    };

    loadPortfolioHoldings();
    
    // Refresh portfolio every 10 seconds
    const interval = setInterval(loadPortfolioHoldings, 10000);
    return () => clearInterval(interval);
  }, [connected, account?.address, stockQuotes]);

  // Handle stock click from portfolio
  const handleStockClick = (stockSymbol: string) => {
    const stock = stocks.find(s => s.symbol === stockSymbol);
    if (stock) {
      setSelectedStock(stock);
      // Scroll to top to see the chart
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  // Convert USD price to selected currency
  const convertPriceToSelectedCurrency = (priceInUSD: number): number => {
    return priceInUSD * exchangeRates[selectedCurrency];
  };

  const currentStockPriceInSelectedCurrency = convertPriceToSelectedCurrency(currentStockPrice);
  const canBuy = currentStockPriceInSelectedCurrency > 0 ? Math.floor(currentBalance / currentStockPriceInSelectedCurrency) : 0;

  // Format chart data with selected currency conversion
  const chartData = intradayData.map((point) => ({
    time: new Date(point.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    price: convertPriceToSelectedCurrency(point.price),
  }));

  const handleBalanceUpdate = () => {
    // Reload balances when currency is minted
    if (connected && account?.address) {
      backendApi.getCurrencyBalances(account.address.toString())
        .then((data) => {
          setInrBalance(data.balances.INR);
          setCnyBalance(data.balances.CNY);
          setEurBalance(data.balances.EUR);
        })
        .catch((error) => {
          console.error("Error refreshing balances:", error);
        });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#ffffff", py: 3 }}>
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

      <Container maxWidth="xl">
        <Typography variant="h3" sx={{ mb: 4, textAlign: "center", fontWeight: 700, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
          TABDEEL
        </Typography>

        {/* Stock Prices Chart - Top Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ bgcolor: "#ffffff", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #e0e0e0" }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
                    {selectedStock.name} ({selectedStock.alphaSymbol})
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
                          {selectedCurrency === "USD" && "$"}
                          {selectedCurrency === "INR" && "₹"}
                          {selectedCurrency === "CNY" && "¥"}
                          {selectedCurrency === "EUR" && "€"}
                          {convertPriceToSelectedCurrency(currentQuote.price).toFixed(2)}
                        </Typography>
                        <Chip
                          label={`${currentQuote.change >= 0 ? "+" : ""}${(currentQuote.change * exchangeRates[selectedCurrency]).toFixed(2)} (${currentQuote.changePercent >= 0 ? "+" : ""}${currentQuote.changePercent.toFixed(2)}%)`}
                          sx={{
                            bgcolor: currentQuote.change >= 0 ? "#e8f5e9" : "#ffebee",
                            color: currentQuote.change >= 0 ? "#2e7d32" : "#d32f2f",
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                      </Box>
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

        {/* Portfolio View - Below Chart */}
        {connected && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12 }}>
              <PortfolioView
                holdings={portfolioHoldings}
                loading={loading || loadingBalances}
                currency={selectedCurrency}
                exchangeRates={exchangeRates}
                onStockClick={handleStockClick}
              />
            </Grid>
          </Grid>
        )}

        {/* Trade Stock Coins Section */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ bgcolor: "#ffffff", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #e0e0e0" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: "#000000", fontFamily: "'Poppins', sans-serif" }}>
                  Trade Stock Coins
                </Typography>

                {/* Current Holdings */}
                <Box sx={{ mb: 3, p: 2, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #00C853" }}>
                  <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontFamily: "'Inter', sans-serif" }}>
                    Your Holdings
                  </Typography>
                  {loadingStockBalance ? (
                    <CircularProgress size={20} sx={{ color: "#00C853" }} />
                  ) : (
                    <>
                      <Typography variant="h5" sx={{ color: "#00C853", fontWeight: 700, mb: 1, fontFamily: "'Poppins', sans-serif" }}>
                        {stockBalance.toFixed(6)} {selectedStock.symbol}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666666", fontFamily: "'Inter', sans-serif" }}>
                        Total Value: ₹{(stockBalance * currentStockPriceInSelectedCurrency * exchangeRates.INR).toFixed(2)}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Current Price */}
                <Box sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontFamily: "'Inter', sans-serif" }}>
                    Current Price
                  </Typography>
                  <Typography variant="h5" sx={{ color: "#000000", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    ₹{(currentStockPrice * exchangeRates.INR).toFixed(2)}
                  </Typography>
                </Box>

                {/* Buy and Sell Buttons */}
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setBuyStockModalOpen(true)}
                    disabled={!connected}
                    sx={{
                      bgcolor: "#00C853",
                      color: "#ffffff",
                      textTransform: "none",
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      py: 1.5,
                      "&:hover": { bgcolor: "#00A043" },
                      "&:disabled": { bgcolor: "#e0e0e0", color: "#bdbdbd" },
                    }}
                  >
                    {connected ? `Buy ${selectedStock.symbol}` : "Connect Wallet"}
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setSellStockModalOpen(true)}
                    disabled={!connected || stockBalance <= 0}
                    sx={{
                      bgcolor: "#d32f2f",
                      color: "#ffffff",
                      textTransform: "none",
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      py: 1.5,
                      "&:hover": { bgcolor: "#b71c1c" },
                      "&:disabled": { bgcolor: "#e0e0e0", color: "#bdbdbd" },
                    }}
                  >
                    {connected ? `Sell ${selectedStock.symbol}` : "Connect Wallet"}
                  </Button>
                </Box>
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
      <BuyStockModal
        open={buyStockModalOpen}
        onClose={() => setBuyStockModalOpen(false)}
        onBuySuccess={() => {
          handleBalanceUpdate();
          if (account?.address) {
            backendApi.getStockBalance(selectedStock.symbol, account.address.toString()).then(setStockBalance);
          }
        }}
      />
      <SellStockModal
        open={sellStockModalOpen}
        onClose={() => setSellStockModalOpen(false)}
        currentStock={selectedStock.symbol}
        currentBalance={stockBalance}
        onSellSuccess={() => {
          handleBalanceUpdate();
          if (account?.address) {
            backendApi.getStockBalance(selectedStock.symbol, account.address.toString()).then(setStockBalance);
          }
        }}
      />
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