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
import type { PortfolioPosition } from '../services/backendApi'

// Stock icons mapping - you can replace these with actual stock logos
const stockIcons = {
  GOOG: '🔍', // Google
  AAPL: '🍎', // Apple
  TSLA: '⚡', // Tesla
  NVDA: '🎮', // NVIDIA
  HOOD: '🏹', // Robinhood
}

const stockNames: Record<string, string> = {
  GOOG: 'Google',
  AAPL: 'Apple',
  TSLA: 'Tesla',
  NVDA: 'NVIDIA',
  HOOD: 'Robinhood',
}

interface PortfolioViewProps {
  positions: PortfolioPosition[]
  totalValue: number
  totalCostBasis: number
  totalUnrealizedPnl: number
  totalPnlPercent: number
  loading?: boolean
  currency?: string
  onStockClick?: (symbol: string) => void
}

export default function PortfolioView({
  positions,
  totalValue,
  totalUnrealizedPnl,
  totalPnlPercent,
  loading = false,
  currency = 'INR',
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

  const isTotalPositive = totalUnrealizedPnl >= 0

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

  // Filter out positions with zero quantity
  const activePositions = positions.filter(p => p.currentQuantity > 0)

  if (activePositions.length === 0) {
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
        {/* Header with Total Value and P&L */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000', fontFamily: "'Poppins', sans-serif", mb: 2 }}>
            Portfolio
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#666666', fontFamily: "'Inter', sans-serif", display: 'block' }}>
                Total Value
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#000000', fontFamily: "'Poppins', sans-serif" }}>
                {getCurrencySymbol(currency)}{totalValue.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: '#666666', fontFamily: "'Inter', sans-serif", display: 'block' }}>
                Unrealized P&L
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: isTotalPositive ? '#2e7d32' : '#d32f2f',
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >
                  {isTotalPositive ? '+' : ''}{getCurrencySymbol(currency)}{totalUnrealizedPnl.toFixed(2)}
                </Typography>
                <Chip
                  icon={isTotalPositive ? <TrendingUp sx={{ fontSize: '0.875rem' }} /> : <TrendingDown sx={{ fontSize: '0.875rem' }} />}
                  label={`${isTotalPositive ? '+' : ''}${totalPnlPercent.toFixed(2)}%`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: isTotalPositive ? '#e8f5e9' : '#ffebee',
                    color: isTotalPositive ? '#2e7d32' : '#d32f2f',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    '& .MuiChip-icon': {
                      color: isTotalPositive ? '#2e7d32' : '#d32f2f',
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Holdings List */}
        <List sx={{ p: 0 }}>
          {activePositions.map((position, index) => {
            const isPositive = (position.unrealizedPnlPercent || 0) >= 0
            const stockName = stockNames[position.stockSymbol] || position.stockSymbol
            const currentValue = position.currentValue || 0
            const currentPrice = position.currentPrice || 0

            return (
              <ListItem
                key={position.stockSymbol}
                onClick={() => onStockClick?.(position.stockSymbol)}
                sx={{
                  px: 2,
                  py: 2,
                  mb: index < activePositions.length - 1 ? 1.5 : 0,
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
                      {stockIcons[position.stockSymbol as keyof typeof stockIcons] || '📈'}
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
                        {stockName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#666666',
                          fontFamily: "'Inter', sans-serif",
                          display: 'block',
                        }}
                      >
                        {position.currentQuantity.toFixed(6)} {position.stockSymbol}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999999',
                          fontFamily: "'Inter', sans-serif",
                          display: 'block',
                        }}
                      >
                        {getCurrencySymbol(position.baseCurrency)}{currentPrice.toFixed(2)} per share
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right side - Value and P&L */}
                  <Box sx={{ textAlign: 'right' }}>
                    {/* Invested and Current Value - Side by Side */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mb: 0.5 }}>
                      {/* Invested Amount */}
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#999999',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.65rem',
                            display: 'block',
                          }}
                        >
                          Invested
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            color: '#666666',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {getCurrencySymbol(position.baseCurrency)}{position.totalCostBasis.toFixed(2)}
                        </Typography>
                      </Box>

                      {/* Current Value */}
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#999999',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.65rem',
                            display: 'block',
                          }}
                        >
                          Current Value
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: '#000000',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {getCurrencySymbol(position.baseCurrency)}{currentValue.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* P&L */}
                    {position.unrealizedPnl !== undefined && position.unrealizedPnl !== null && (
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: isPositive ? '#2e7d32' : '#d32f2f',
                          fontFamily: "'Inter', sans-serif",
                          mb: 0.5,
                        }}
                      >
                        {isPositive ? '+' : ''}{getCurrencySymbol(position.baseCurrency)}{position.unrealizedPnl.toFixed(2)}
                      </Typography>
                    )}
                    {position.unrealizedPnlPercent !== null && (
                      <Chip
                        icon={isPositive ? <TrendingUp sx={{ fontSize: '0.875rem' }} /> : <TrendingDown sx={{ fontSize: '0.875rem' }} />}
                        label={`${isPositive ? '+' : ''}${position.unrealizedPnlPercent.toFixed(2)}%`}
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