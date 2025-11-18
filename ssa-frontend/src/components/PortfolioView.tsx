import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  Avatar,
  Skeleton,
  Chip
} from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'

// Stock icons mapping - you can replace these with actual stock logos
const stockIcons = {
  GOOG: '🔍', // Google
  AAPL: '🍎', // Apple
  TSLA: '⚡', // Tesla
  NVDA: '🎮', // NVIDIA
  HOOD: '🏹', // Robinhood
}

interface StockHolding {
  symbol: string
  name: string
  balance: number
  currentPrice: number
  value: number
  change?: number
  changePercent?: number
}

interface PortfolioViewProps {
  holdings: StockHolding[]
  loading?: boolean
  currency?: string
  exchangeRates?: Record<string, number>
  onStockClick?: (symbol: string) => void
}

export default function PortfolioView({ 
  holdings, 
  loading = false,
  currency = 'USD',
  exchangeRates = { USD: 1, INR: 90, CNY: 7.2, EUR: 0.92 },
  onStockClick
}: PortfolioViewProps) {
  
  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      INR: '₹',
      CNY: '¥',
      EUR: '€',
    }
    return symbols[curr] || '$'
  }

  const convertValue = (valueInUSD: number) => {
    return valueInUSD * (exchangeRates[currency] || 1)
  }

  const totalPortfolioValue = holdings.reduce((sum, holding) => sum + holding.value, 0)
  const convertedTotal = convertValue(totalPortfolioValue)

  if (loading) {
    return (
      <Card sx={{ bgcolor: '#ffffff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#000000', fontFamily: "'Poppins', sans-serif" }}>
            Portfolio
          </Typography>
          <List sx={{ p: 0 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <ListItem key={i} sx={{ px: 0, py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box>
                      <Skeleton variant="text" width={100} height={20} />
                      <Skeleton variant="text" width={60} height={16} />
                    </Box>
                  </Box>
                  <Skeleton variant="text" width={80} height={20} />
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    )
  }

  // Filter out holdings with zero balance
  const activeHoldings = holdings.filter(h => h.balance > 0)

  if (activeHoldings.length === 0) {
    return (
      <Card sx={{ bgcolor: '#ffffff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#000000', fontFamily: "'Poppins', sans-serif" }}>
            Portfolio
          </Typography>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: '#666666', fontFamily: "'Inter', sans-serif", mb: 1 }}>
              No stock holdings yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#999999', fontFamily: "'Inter', sans-serif" }}>
              Buy some stocks to start building your portfolio
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{ bgcolor: '#ffffff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header with Total Value */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000', fontFamily: "'Poppins', sans-serif" }}>
            Portfolio
          </Typography>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#666666', fontFamily: "'Inter', sans-serif", display: 'block' }}>
              Total Value
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#000000', fontFamily: "'Poppins', sans-serif" }}>
              {getCurrencySymbol(currency)}{convertedTotal.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Holdings List */}
        <List sx={{ p: 0 }}>
          {activeHoldings.map((holding, index) => {
            const convertedValue = convertValue(holding.value)
            const convertedPrice = convertValue(holding.currentPrice)
            const isPositive = (holding.change || 0) >= 0

            return (
              <ListItem
                key={holding.symbol}
                onClick={() => onStockClick?.(holding.symbol)}
                sx={{
                  px: 2,
                  py: 2,
                  mb: index < activeHoldings.length - 1 ? 1.5 : 0,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  bgcolor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    borderColor: '#00C853',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,200,83,0.15)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  {/* Left side - Icon and Stock Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Stock Icon */}
                    <Avatar
                      sx={{
                        bgcolor: '#e8f5e9',
                        color: '#00C853',
                        width: 40,
                        height: 40,
                        fontSize: '1.5rem',
                      }}
                    >
                      {stockIcons[holding.symbol as keyof typeof stockIcons] || '📈'}
                    </Avatar>
                    
                    {/* Stock Name and Balance */}
                    <Box>
                      <Typography 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.875rem',
                          color: '#000000',
                          fontFamily: "'Inter', sans-serif",
                          mb: 0.5,
                        }}
                      >
                        {holding.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#666666',
                          fontFamily: "'Inter', sans-serif",
                          display: 'block',
                        }}
                      >
                        {holding.balance.toFixed(6)} {holding.symbol}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#999999',
                          fontFamily: "'Inter', sans-serif",
                          display: 'block',
                        }}
                      >
                        {getCurrencySymbol(currency)}{convertedPrice.toFixed(2)} per share
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right side - Value and Change */}
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#000000',
                        fontFamily: "'Inter', sans-serif",
                        mb: 0.5,
                      }}
                    >
                      {getCurrencySymbol(currency)}{convertedValue.toFixed(2)}
                    </Typography>
                    {holding.changePercent !== undefined && (
                      <Chip
                        icon={isPositive ? <TrendingUp sx={{ fontSize: '0.875rem' }} /> : <TrendingDown sx={{ fontSize: '0.875rem' }} />}
                        label={`${isPositive ? '+' : ''}${holding.changePercent.toFixed(2)}%`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.75rem',
                          bgcolor: isPositive ? '#e8f5e9' : '#ffebee',
                          color: isPositive ? '#2e7d32' : '#d32f2f',
                          fontWeight: 600,
                          fontFamily: "'Inter', sans-serif",
                          '& .MuiChip-icon': {
                            color: isPositive ? '#2e7d32' : '#d32f2f',
                          },
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </ListItem>
            )
          })}
        </List>
      </CardContent>
    </Card>
  )
}