import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { Box, Container, Grid, Card, CardContent, Typography, Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import WalletButton from "./components/Wallet";
import { useState } from "react";

const exchangeRates = { INR: 83.5, USD: 1.0, CNY: 7.2 };
const stocks = [
  { name: "Google", symbol: "GOOGL", price: 150.5, data: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, price: 150 + Math.sin(i) * 5 })) },
  { name: "Apple", symbol: "AAPL", price: 175.2, data: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, price: 175 + Math.cos(i) * 4 })) },
  { name: "Microsoft", symbol: "MSFT", price: 380.8, data: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, price: 380 + Math.sin(i * 0.5) * 6 })) },
];

export default function App() {
  const [aptBalance] = useState(1000);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [selectedStock, setSelectedStock] = useState(stocks[0]);

  const currencyValue = aptBalance * exchangeRates[selectedCurrency as keyof typeof exchangeRates];
  const canBuy = Math.floor(currencyValue / selectedStock.price);

  return (
    <AptosWalletAdapterProvider autoConnect={true} dappConfig={{ network: Network.TESTNET }}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#000", color: "#fff", py: 4 }}>
        <WalletButton />
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ mb: 4, textAlign: "center", color: "#FF8C42" }}>
            Stable SPY Aptos
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: "#1a1a1a", borderRadius: 3, boxShadow: "0 0 2px #888" }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: "#FF8C42" }}>Currency Exchange</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>APT Balance: {aptBalance.toFixed(2)}</Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: "#fff" }}>Select Currency</InputLabel>
                    <Select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      sx={{ color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#444" } }}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="INR">INR</MenuItem>
                      <MenuItem value="CNY">CNY</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="h5" sx={{ color: "#FF8C42" }}>
                    {currencyValue.toFixed(2)} {selectedCurrency}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2, bgcolor: "#FF8C42", "&:hover": { bgcolor: "#FF7A2E" } }}
                  >
                    Purchase {selectedCurrency}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ bgcolor: "#1a1a1a", borderRadius: 3, boxShadow: "0 0 2px #888", mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: "#FF8C42" }}>Stock Prices</Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel sx={{ color: "#fff" }}>Select Stock</InputLabel>
                    <Select
                      value={selectedStock.symbol}
                      onChange={(e) => setSelectedStock(stocks.find(s => s.symbol === e.target.value) || stocks[0])}
                      sx={{ color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#444" } }}
                    >
                      {stocks.map((stock) => (
                        <MenuItem key={stock.symbol} value={stock.symbol}>
                          {stock.name} ({stock.symbol})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={selectedStock.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="day" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ bgcolor: "#1a1a1a", border: "1px solid #444" }} />
                      <Line type="monotone" dataKey="price" stroke="#FF8C42" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: "#1a1a1a", borderRadius: 3, boxShadow: "0 0 2px #888" }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: "#FF8C42" }}>Purchase Stock Coins</Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Current Price: {selectedStock.price.toFixed(2)} {selectedCurrency}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    You can buy: {canBuy} {selectedStock.symbol} coins
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2, bgcolor: "#FF8C42", "&:hover": { bgcolor: "#FF7A2E" } }}
                  >
                    Buy {selectedStock.symbol} Coins
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </AptosWalletAdapterProvider>
  );
}
