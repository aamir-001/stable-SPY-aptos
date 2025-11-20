import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Card, CardContent, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
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

// Stock name mapping
const stockNames: Record<string, string> = {
  GOOG: 'Google',
  AAPL: 'Apple',
  TSLA: 'Tesla',
  NVDA: 'NVIDIA',
  HOOD: 'Robinhood',
};

interface StockDetailViewProps {
  walletAddress?: string;
}

export default function StockDetailView({ walletAddress }: StockDetailViewProps) {
  const { stock } = useParams<{ stock: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockPositionDetail | null>(null);

  useEffect(() => {
    const fetchStockDetail = async () => {
      if (!walletAddress || !stock) {
        setError('Wallet not connected or invalid stock symbol');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await backendApi.getStockPosition(walletAddress, stock.toUpperCase());
        setStockData(data);
      } catch (err: any) {
        console.error('Error fetching stock details:', err);
        setError(err.message || 'Failed to load stock details');
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetail();
  }, [walletAddress, stock]);

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
          Back to Portfolio
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
  const stockName = stockNames[stockSymbol] || stockSymbol;

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
        Back to Portfolio
      </Button>

      {/* Stock Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "'Inter', sans-serif", mb: 1 }}>
          {stockName} ({stockSymbol})
        </Typography>
        <Typography variant="h5" sx={{ color: '#666666', fontFamily: "'Inter', sans-serif" }}>
          {currencySymbol}{currentPrice.toFixed(2)} per share
        </Typography>
      </Box>

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
    </Container>
  );
}
