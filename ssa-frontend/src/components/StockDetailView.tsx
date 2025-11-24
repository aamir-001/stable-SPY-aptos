import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Card, CardContent, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogContent, TextField, Alert, Avatar } from '@mui/material';
import { ArrowLeft, TrendingUp, TrendingDown, ShoppingCart, DollarSign } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { backendApi } from '../services/backendApi';
import type { StockPositionDetail } from '../services/backendApi';

// Currency symbol helper
const getCurrencySymbol = (curr: string) => {
  const symbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    CNY: '¥',
    EUR: '€',
  };
  return symbols[curr] || '$';
};

// Stock name and logo mapping
const stockInfo: Record<string, { name: string; logo: string }> = {
  GOOG: { name: 'Google', logo: 'https://logo.clearbit.com/google.com' },
  AAPL: { name: 'Apple', logo: 'https://logo.clearbit.com/apple.com' },
  TSLA: { name: 'Tesla', logo: 'https://logo.clearbit.com/tesla.com' },
  NVDA: { name: 'NVIDIA', logo: 'https://logo.clearbit.com/nvidia.com' },
  HOOD: { name: 'Robinhood', logo: 'https://logo.clearbit.com/robinhood.com' },
  // Private market stocks
  STRIPE: { name: 'Stripe', logo: 'https://logo.clearbit.com/stripe.com' },
  OPENAI: { name: 'OpenAI', logo: 'https://logo.clearbit.com/openai.com' },
  DATABRICKS: { name: 'Databricks', logo: 'https://logo.clearbit.com/databricks.com' },
  SPACEX: { name: 'SpaceX', logo: 'https://logo.clearbit.com/spacex.com' },
};

// Private market stock prices (USDC)
const privateStockPrices: Record<string, number> = {
  STRIPE: 0.45,
  OPENAI: 0.50,
  DATABRICKS: 0.35,
  SPACEX: 0.40,
};

// Check if stock is a private market stock
const isPrivateStock = (symbol: string) => symbol in privateStockPrices;

// Generate dummy price chart data
const generateChartData = (currentPrice: number, days: number = 30) => {
  const data = [];
  let price = currentPrice * 0.9; // Start from 90% of current price

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Random walk with slight upward bias
    const change = (Math.random() - 0.45) * (currentPrice * 0.02);
    price = Math.max(price + change, currentPrice * 0.7);

    // Make the last point exactly the current price
    if (i === 0) price = currentPrice;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(2)),
    });
  }
  return data;
};

interface StockDetailViewProps {
  walletAddress?: string;
}

export default function StockDetailView({ walletAddress }: StockDetailViewProps) {
  const { stock } = useParams<{ stock: string }>();
  const navigate = useNavigate();
  const { account, connected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockPositionDetail | null>(null);
  const [chartData, setChartData] = useState<{ date: string; price: number }[]>([]);

  // Buy modal state
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyAmount, setBuyAmount] = useState('');
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buySuccess, setBuySuccess] = useState<string | null>(null);

  // Sell modal state
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellAmount, setSellAmount] = useState('');
  const [selling, setSelling] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);
  const [sellSuccess, setSellSuccess] = useState<string | null>(null);

  const fetchStockDetail = async () => {
    if (!walletAddress || !stock) {
      setError('Wallet not connected or invalid stock symbol');
      setLoading(false);
      return;
    }

    const upperStock = stock.toUpperCase();

    try {
      setLoading(true);
      setError(null);

      if (isPrivateStock(upperStock)) {
        // For private market stocks, create data from balance
        const price = privateStockPrices[upperStock];
        const balance = await backendApi.getPrivateStockBalance(walletAddress, upperStock);

        const mockData: StockPositionDetail = {
          success: true,
          stockSymbol: upperStock,
          currentPrice: price,
          position: {
            currentQuantity: balance,
            currentValue: balance * price,
            totalCostBasis: 0,
            averageCostPerShare: 0,
          },
          pnl: {
            unrealizedPnl: 0,
            unrealizedPnlPercent: 0,
            realizedPnl: 0,
            totalPnl: 0,
            totalPnlPercent: 0,
          },
          baseCurrency: 'USDC',
          transactions: [],
        };

        setStockData(mockData);
        setChartData(generateChartData(price));
      } else {
        const data = await backendApi.getStockPosition(walletAddress, upperStock);
        setStockData(data);
        setChartData(generateChartData(data.currentPrice));
      }
    } catch (err: any) {
      console.error('Error fetching stock details:', err);
      setError(err.message || 'Failed to load stock details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockDetail();
  }, [walletAddress, stock]);

  const handleBuy = async () => {
    if (!account?.address || !buyAmount || !stock) {
      setBuyError('Please enter an amount');
      return;
    }

    const amountNum = parseFloat(buyAmount);
    if (amountNum <= 0) {
      setBuyError('Amount must be greater than 0');
      return;
    }

    const upperStock = stock.toUpperCase();
    setBuying(true);
    setBuyError(null);
    setBuySuccess(null);

    try {
      if (isPrivateStock(upperStock)) {
        // Private market buy with USDC
        const result = await backendApi.buyPrivateStock({
          userAddress: account.address.toString(),
          stock: upperStock,
          amount: amountNum,
        });

        setBuySuccess(
          `Bought ${result.tokenAmount.toFixed(6)} ${upperStock} for $${result.totalSpent.toFixed(4)} USDC`
        );
      } else {
        // Public market buy with INR
        const result = await backendApi.buyStock({
          userAddress: account.address.toString(),
          stock: upperStock,
          amount: amountNum,
        });

        setBuySuccess(
          `Bought ${result.stockAmount.toFixed(6)} ${upperStock} for ₹${result.totalSpent.toFixed(2)}`
        );
      }
      setBuyAmount('');
      fetchStockDetail(); // Refresh data
    } catch (err: any) {
      setBuyError(err.message || 'Failed to buy stock');
    } finally {
      setBuying(false);
    }
  };

  const handleSell = async () => {
    if (!account?.address || !sellAmount || !stock) {
      setSellError('Please enter an amount');
      return;
    }

    const amountNum = parseFloat(sellAmount);
    if (amountNum <= 0) {
      setSellError('Amount must be greater than 0');
      return;
    }

    const upperStock = stock.toUpperCase();

    if (stockData && amountNum > stockData.position.currentQuantity) {
      setSellError(`You only have ${stockData.position.currentQuantity.toFixed(6)} ${upperStock} tokens`);
      return;
    }

    setSelling(true);
    setSellError(null);
    setSellSuccess(null);

    try {
      if (isPrivateStock(upperStock)) {
        // Private market sell for USDC
        const result = await backendApi.sellPrivateStock({
          userAddress: account.address.toString(),
          stock: upperStock,
          amount: amountNum,
        });

        setSellSuccess(
          `Sold ${result.tokensSold.toFixed(6)} ${upperStock} for $${result.netReceived.toFixed(4)} USDC`
        );
      } else {
        // Public market sell for INR
        const result = await backendApi.sellStock({
          userAddress: account.address.toString(),
          stock: upperStock,
          amount: amountNum,
        });

        setSellSuccess(
          `Sold ${result.stocksSold.toFixed(6)} ${upperStock} for ₹${result.totalReceived.toFixed(2)}`
        );
      }
      setSellAmount('');
      fetchStockDetail(); // Refresh data
    } catch (err: any) {
      setSellError(err.message || 'Failed to sell stock');
    } finally {
      setSelling(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !stockData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Button startIcon={<ArrowLeft size={20} />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
          Back to Home
        </Button>
        <Card>
          <CardContent>
            <Typography color="error">{error || 'No data available'}</Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const { stockSymbol, currentPrice, position, pnl, baseCurrency, transactions } = stockData;
  const currencySymbol = getCurrencySymbol(baseCurrency);
  const info = stockInfo[stockSymbol] || { name: stockSymbol, logo: '' };

  const isUnrealizedPositive = pnl.unrealizedPnl >= 0;
  const isRealizedPositive = pnl.realizedPnl >= 0;
  const isTotalPositive = pnl.totalPnl >= 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowLeft size={20} />}
        onClick={() => navigate('/')}
        sx={{ mb: 3, color: '#666666', '&:hover': { bgcolor: '#f5f5f5' } }}
      >
        Back to Home
      </Button>

      {/* Stock Header with Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <Avatar
          src={info.logo}
          sx={{ width: 64, height: 64, bgcolor: '#f5f5f5' }}
        >
          {stockSymbol[0]}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "'Inter', sans-serif", mb: 0.5 }}>
            {info.name} ({stockSymbol})
          </Typography>
          <Typography variant="h5" sx={{ color: '#666666', fontFamily: "'Inter', sans-serif" }}>
            {currencySymbol}{currentPrice.toFixed(2)} per share
          </Typography>
        </Box>
        {/* Buy/Sell Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<ShoppingCart size={18} />}
            onClick={() => {
              setBuyError(null);
              setBuySuccess(null);
              setBuyAmount('');
              setBuyModalOpen(true);
            }}
            disabled={!connected}
            sx={{
              bgcolor: '#00C853',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              '&:hover': { bgcolor: '#00A043' },
              '&:disabled': { bgcolor: '#e0e0e0', color: '#bdbdbd' },
            }}
          >
            Buy {stockSymbol}
          </Button>
          <Button
            variant="contained"
            startIcon={<DollarSign size={18} />}
            onClick={() => {
              setSellError(null);
              setSellSuccess(null);
              setSellAmount('');
              setSellModalOpen(true);
            }}
            disabled={!connected || position.currentQuantity <= 0}
            sx={{
              bgcolor: '#d32f2f',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              '&:hover': { bgcolor: '#b71c1c' },
              '&:disabled': { bgcolor: '#e0e0e0', color: '#bdbdbd' },
            }}
          >
            Sell {stockSymbol}
          </Button>
        </Box>
      </Box>

      {/* Price Chart */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontFamily: "'Inter', sans-serif" }}>
            Price History (30 Days)
          </Typography>
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C853" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#999999"
                  tick={{ fill: '#666666', fontSize: 12 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis
                  stroke="#999999"
                  tick={{ fill: '#666666', fontSize: 12 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  tickFormatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ color: '#666666', fontWeight: 500 }}
                  formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Price']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#00C853"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Current Position Card */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontFamily: "'Inter', sans-serif" }}>
            Current Position
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#999999', fontFamily: "'Inter', sans-serif" }}>
                Shares Owned
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                {position.currentQuantity.toFixed(6)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#999999', fontFamily: "'Inter', sans-serif" }}>
                Average Cost
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                {currencySymbol}{position.averageCostPerShare.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#999999', fontFamily: "'Inter', sans-serif" }}>
                Total Invested
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                {currencySymbol}{position.totalCostBasis.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#999999', fontFamily: "'Inter', sans-serif" }}>
                Current Value
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                {currencySymbol}{position.currentValue.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Gains Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        {/* Unrealized Gains */}
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `2px solid ${isUnrealizedPositive ? '#e8f5e9' : '#ffebee'}` }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {isUnrealizedPositive ? (
                <TrendingUp size={20} color="#2e7d32" />
              ) : (
                <TrendingDown size={20} color="#d32f2f" />
              )}
              <Typography variant="caption" sx={{ ml: 1, color: '#999999', fontFamily: "'Inter', sans-serif" }}>
                Unrealized P&L
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: isUnrealizedPositive ? '#2e7d32' : '#d32f2f', fontFamily: "'Inter', sans-serif", mb: 0.5 }}>
              {isUnrealizedPositive ? '+' : ''}{currencySymbol}{pnl.unrealizedPnl.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ color: isUnrealizedPositive ? '#2e7d32' : '#d32f2f', fontFamily: "'Inter', sans-serif" }}>
              {isUnrealizedPositive ? '+' : ''}{pnl.unrealizedPnlPercent.toFixed(2)}%
            </Typography>
          </CardContent>
        </Card>

        {/* Realized Gains */}
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `2px solid ${isRealizedPositive ? '#e8f5e9' : '#ffebee'}` }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {isRealizedPositive ? (
                <TrendingUp size={20} color="#2e7d32" />
              ) : (
                <TrendingDown size={20} color="#d32f2f" />
              )}
              <Typography variant="caption" sx={{ ml: 1, color: '#999999', fontFamily: "'Inter', sans-serif" }}>
                Realized P&L
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: isRealizedPositive ? '#2e7d32' : '#d32f2f', fontFamily: "'Inter', sans-serif" }}>
              {isRealizedPositive ? '+' : ''}{currencySymbol}{pnl.realizedPnl.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666666', fontFamily: "'Inter', sans-serif" }}>
              From closed positions
            </Typography>
          </CardContent>
        </Card>

        {/* Total Gains */}
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: `2px solid ${isTotalPositive ? '#e8f5e9' : '#ffebee'}` }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {isTotalPositive ? (
                <TrendingUp size={20} color="#2e7d32" />
              ) : (
                <TrendingDown size={20} color="#d32f2f" />
              )}
              <Typography variant="caption" sx={{ ml: 1, color: '#999999', fontFamily: "'Inter', sans-serif" }}>
                Total P&L
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: isTotalPositive ? '#2e7d32' : '#d32f2f', fontFamily: "'Inter', sans-serif", mb: 0.5 }}>
              {isTotalPositive ? '+' : ''}{currencySymbol}{pnl.totalPnl.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ color: isTotalPositive ? '#2e7d32' : '#d32f2f', fontFamily: "'Inter', sans-serif" }}>
              {isTotalPositive ? '+' : ''}{pnl.totalPnlPercent.toFixed(2)}%
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Transaction History */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontFamily: "'Inter', sans-serif" }}>
            Transaction History
          </Typography>
          {transactions.length === 0 ? (
            <Typography sx={{ color: '#999999', textAlign: 'center', py: 4 }}>
              No transactions yet
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Total Value</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Realized P&L</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx, index) => {
                    const isBuy = tx.type === 'BUY';
                    const realizedPnl = tx.realizedPnl || 0;
                    const isPnlPositive = realizedPnl >= 0;

                    return (
                      <TableRow key={index} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                        <TableCell>
                          <Chip
                            label={tx.type}
                            size="small"
                            sx={{
                              bgcolor: isBuy ? '#e3f2fd' : '#fff3e0',
                              color: isBuy ? '#1976d2' : '#f57c00',
                              fontWeight: 600,
                              fontFamily: "'Inter', sans-serif"
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "'Inter', sans-serif" }}>
                          {tx.quantity.toFixed(6)}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "'Inter', sans-serif" }}>
                          {tx.pricePerShare ? `${currencySymbol}${tx.pricePerShare.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "'Inter', sans-serif" }}>
                          {currencySymbol}{tx.totalValue.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{
                          fontFamily: "'Inter', sans-serif",
                          color: tx.type === 'SELL' ? (isPnlPositive ? '#2e7d32' : '#d32f2f') : '#999999',
                          fontWeight: tx.type === 'SELL' ? 600 : 400
                        }}>
                          {tx.type === 'SELL' && tx.realizedPnl !== null
                            ? `${isPnlPositive ? '+' : ''}${currencySymbol}${realizedPnl.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#666666' }}>
                          {new Date(tx.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tx.status}
                            size="small"
                            sx={{
                              bgcolor: tx.status === 'SUCCESS' ? '#e8f5e9' : '#ffebee',
                              color: tx.status === 'SUCCESS' ? '#2e7d32' : '#d32f2f',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              fontFamily: "'Inter', sans-serif"
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Buy Modal */}
      <Dialog
        open={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            minWidth: 450,
          },
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar src={info.logo} sx={{ width: 40, height: 40 }}>
              {stockSymbol[0]}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000', fontFamily: "'Inter', sans-serif" }}>
              Buy {info.name} ({stockSymbol})
            </Typography>
          </Box>

          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#666666', mb: 0.5 }}>
              Current Price
            </Typography>
            <Typography variant="h6" sx={{ color: isPrivateStock(stockSymbol) ? '#1565c0' : '#00C853', fontWeight: 600 }}>
              {isPrivateStock(stockSymbol) ? `$${currentPrice.toFixed(2)} USDC` : `${currencySymbol}${currentPrice.toFixed(2)}`} per share
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#666666', mb: 1, fontWeight: 500 }}>
              Amount in {isPrivateStock(stockSymbol) ? 'USDC' : 'INR'}
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              placeholder="0.00"
              disabled={buying}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#000000',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#00C853' },
                  '&.Mui-focused fieldset': { borderColor: '#00C853' },
                },
              }}
            />
          </Box>

          {buyAmount && parseFloat(buyAmount) > 0 && (
            <Typography variant="body2" sx={{ color: '#666666', mb: 2 }}>
              You will receive approximately {(parseFloat(buyAmount) / currentPrice).toFixed(6)} {stockSymbol} tokens
              {isPrivateStock(stockSymbol) && ' (paid in USDC)'}
            </Typography>
          )}

          {buyError && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: '#ffebee', color: '#d32f2f' }}>
              {buyError}
            </Alert>
          )}
          {buySuccess && (
            <Alert severity="success" sx={{ mb: 2, bgcolor: '#e8f5e9', color: '#2e7d32' }}>
              {buySuccess}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setBuyModalOpen(false)}
              fullWidth
              sx={{
                borderColor: '#e0e0e0',
                color: '#666666',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { borderColor: '#bdbdbd', bgcolor: '#f5f5f5' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleBuy}
              disabled={buying || !buyAmount || parseFloat(buyAmount) <= 0}
              fullWidth
              sx={{
                bgcolor: '#00C853',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#00A043' },
                '&:disabled': { bgcolor: '#e0e0e0', color: '#bdbdbd' },
              }}
            >
              {buying ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : `Buy ${stockSymbol}`}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Sell Modal */}
      <Dialog
        open={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            minWidth: 450,
          },
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar src={info.logo} sx={{ width: 40, height: 40 }}>
              {stockSymbol[0]}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000', fontFamily: "'Inter', sans-serif" }}>
              Sell {info.name} ({stockSymbol})
            </Typography>
          </Box>

          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#666666', mb: 0.5 }}>
              Your Balance
            </Typography>
            <Typography variant="h6" sx={{ color: '#00C853', fontWeight: 600 }}>
              {position.currentQuantity.toFixed(6)} {stockSymbol}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#666666', mb: 1, fontWeight: 500 }}>
              Amount to Sell (in {stockSymbol} tokens)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder="0.000000"
              disabled={selling}
              inputProps={{
                step: '0.000001',
                min: '0',
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#000000',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#d32f2f' },
                  '&.Mui-focused fieldset': { borderColor: '#d32f2f' },
                },
              }}
            />
            <Button
              size="small"
              onClick={() => setSellAmount(position.currentQuantity.toString())}
              sx={{ mt: 1, textTransform: 'none', color: '#d32f2f' }}
            >
              Sell All
            </Button>
          </Box>

          {sellAmount && parseFloat(sellAmount) > 0 && (
            <Typography variant="body2" sx={{ color: '#666666', mb: 2 }}>
              You will receive approximately {isPrivateStock(stockSymbol) ? `$${(parseFloat(sellAmount) * currentPrice).toFixed(4)} USDC` : `${currencySymbol}${(parseFloat(sellAmount) * currentPrice).toFixed(2)}`}
            </Typography>
          )}

          {sellError && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: '#ffebee', color: '#d32f2f' }}>
              {sellError}
            </Alert>
          )}
          {sellSuccess && (
            <Alert severity="success" sx={{ mb: 2, bgcolor: '#e8f5e9', color: '#2e7d32' }}>
              {sellSuccess}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setSellModalOpen(false)}
              fullWidth
              sx={{
                borderColor: '#e0e0e0',
                color: '#666666',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { borderColor: '#bdbdbd', bgcolor: '#f5f5f5' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSell}
              disabled={selling || !sellAmount || parseFloat(sellAmount) <= 0}
              fullWidth
              sx={{
                bgcolor: '#d32f2f',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#b71c1c' },
                '&:disabled': { bgcolor: '#e0e0e0', color: '#bdbdbd' },
              }}
            >
              {selling ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : `Sell ${stockSymbol}`}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
