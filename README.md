# TABDEEL - Stable SPY Aptos

A modern decentralized finance (DeFi) platform built on Aptos blockchain that allows users to exchange cryptocurrencies for stable currencies (INR, USD, CNY, EUR) and purchase stock tokens representing real-world assets.

## 🚀 Features

- **Real-Time Stock Prices**: Live stock market data from Yahoo Finance API
- **Currency Exchange**: Convert APT tokens to stable currencies (INR, USD, CNY, EUR)
- **Stock Token Trading**: Purchase stock tokens (Google, Apple, Tesla, NVIDIA, Robinhood) using stable currencies
- **Wallet Integration**: Seamless Aptos wallet connection and management
- **Interactive Charts**: Real-time intraday price charts for selected stocks
- **Backend API**: Express.js REST API for blockchain interactions
- **Auto-updating Balances**: Real-time balance updates with polling and immediate refresh
- **Modern UI**: Clean, Robinhood-inspired interface with black/white theme and green accents

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **Recharts** - Data visualization
- **Vite** - Build tool
- **Aptos TS SDK** - Blockchain interaction
- **Aptos Wallet Adapter** - Wallet connectivity
- **Axios** - HTTP client for API calls

### Backend
- **Express.js** - REST API server
- **TypeScript** - Type safety
- **Aptos TS SDK** - Blockchain interaction
- **Node.js** - Runtime environment
- **CORS** - Cross-origin resource sharing

### Smart Contracts
- **Move** - Aptos smart contract language
- **Aptos Framework** - Standard library

### APIs
- **Yahoo Finance API** - Stock market data (free, no API key required)
- **Backend REST API** - Centralized blockchain interaction

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Aptos CLI** (optional, for contract deployment)
- **Aptos Wallet** (Petra, Martian, or other Aptos-compatible wallet)

## 🏗️ Project Structure

```
stable-SPY-aptos/
├── contract/                 # Move smart contracts
│   ├── sources/
│   │   ├── Currency-tokens/ # INR, CNY, EUR coin contracts
│   │   ├── Stock-tokens/    # Stock token contracts (GOOG, AAPL, TSLA, etc.)
│   │   └── Utilities/       # Exchange contracts (ExchangeV2)
│   └── Move.toml
├── backend/                 # Express.js backend server
│   ├── src/
│   │   ├── routes/         # API routes (exchange, currency, token)
│   │   ├── services/       # Business logic (exchangeService, priceService, tokenService)
│   │   ├── aptosClient.ts  # Aptos SDK client and signer
│   │   └── index.ts        # Express server entry point
│   ├── .env                # Environment variables (not in repo)
│   └── package.json
├── ssa-frontend/            # React frontend application
│   ├── src/
│   │   ├── components/      # React components (modals, headers)
│   │   ├── services/       # API services (backendApi, stockApi)
│   │   ├── utils/          # Utility functions (Aptos client)
│   │   └── App.tsx         # Main application component
│   ├── vite.config.ts      # Vite configuration with proxy
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stable-SPY-aptos
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Aptos Network Configuration
APTOS_NETWORK=testnet

# Your deployed contract address
MY_ADDR=0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d

# Admin wallet private key (KEEP SECURE - DO NOT COMMIT)
PRIVATE_KEY=0xyour_private_key_here

# Server Configuration
PORT=3001
```

**Security Note**: Never commit your `.env` file or private key to version control!

#### Run the Backend Server

```bash
npm run dev
```

The backend will start at `http://localhost:3001`. You should see:
```
🚀 Backend listening at http://localhost:3001
📊 Exchange API: http://localhost:3001/exchange
💰 Currency API: http://localhost:3001/currency
🪙 Token API: http://localhost:3001/token
✅ Server is ready to accept connections
```

### 3. Frontend Setup

#### Install Dependencies

```bash
cd ssa-frontend
npm install
```

#### Run the Development Server

```bash
npm run dev
```

The frontend will start at `http://localhost:5173` (or the port shown in terminal).

The Vite proxy is already configured to forward `/api` requests to `http://localhost:3001`.

### 4. Connect Your Wallet

1. Install an Aptos wallet extension (Petra, Martian, etc.)
2. Switch to Aptos Testnet in your wallet
3. Click "Connect Wallet" in the top right corner
4. Select your wallet and approve the connection

## 📱 Usage Guide

### 1. Mint INR Currency

Before buying stocks, you need INR tokens:

1. Click "Manage INR" button in the currency header
2. Enter the amount of INR you want to mint (e.g., 10000)
3. Click "Mint INR"
4. Wait for the transaction to complete
5. Your INR balance will update automatically

### 2. View Stock Prices

1. The main dashboard displays real-time stock prices
2. Select a stock from the dropdown (GOOG, AAPL, TSLA, NVDA, HOOD)
3. View current price in USD and INR
4. See your current holdings and total value
5. Prices update automatically every minute

### 3. Buy Stock Tokens

1. Select a stock from the stock selector
2. Click "Buy Stock" button
3. In the buy modal:
   - Enter the amount of INR you want to spend
   - See how many whole stocks you can buy
   - View the price per stock
   - Click "Buy Stock" to execute
4. Wait for the transaction to complete
5. Your stock holdings and INR balance will update automatically

### 4. Sell Stock Tokens

1. Select a stock you own
2. View your current holdings
3. Click "Sell Stock" button
4. In the sell modal:
   - Enter the number of stocks to sell
   - See the total INR you'll receive
   - Click "Sell Stock" to execute
5. Wait for the transaction to complete
6. Your stock holdings and INR balance will update automatically

### 5. Auto-updating Balances

- Stock balances refresh every 5 seconds automatically
- Currency balances refresh every 5 seconds automatically
- Balances also refresh immediately after buy/sell transactions
- No need to manually refresh the page

## 🔌 Backend API Endpoints

Base URL: `http://localhost:3001`

### Health Check

#### GET `/`
Check if the backend is running.

**Response:**
```json
{
  "status": "OK",
  "message": "Stock Exchange API is running",
  "version": "1.0.0",
  "endpoints": {
    "exchange": "/exchange - Buy/Sell stocks",
    "currency": "/currency - Mint/Burn/Balance currencies (INR, EUR, CNY)",
    "token": "/token - Get token balances (stocks and currencies)"
  }
}
```

---

### Exchange Endpoints

#### POST `/exchange/buy`
Buy stock tokens with currency.

**Request Body:**
```json
{
  "userAddress": "0x123...",
  "stock": "GOOG",
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0xabc...",
  "stockAmount": 4,
  "pricePerStock": 225.50,
  "totalSpent": 902.00,
  "change": 98.00
}
```

**Notes:**
- `amount` is the INR amount to spend
- Only whole stocks are purchased
- Excess change is returned
- All amounts use 6 decimal precision internally (microunits)

#### POST `/exchange/sell`
Sell stock tokens for currency.

**Request Body:**
```json
{
  "userAddress": "0x123...",
  "stock": "AAPL",
  "amount": 2
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0xdef...",
  "stocksSold": 2,
  "pricePerStock": 225.00,
  "totalReceived": 450.00
}
```

**Notes:**
- `amount` is the number of whole stocks to sell
- Price is fetched from Yahoo Finance API
- INR is credited to user's account

---

### Currency Endpoints

#### POST `/currency/mint`
Mint currency tokens (INR, EUR, or CNY).

**Request Body:**
```json
{
  "currency": "INR",
  "userAddress": "0x123...",
  "amount": 10000
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0xghi...",
  "currency": "INR",
  "amount": 10000,
  "scaledAmount": 10000000000
}
```

**Notes:**
- `amount` is in whole currency units
- `scaledAmount` is the microunit amount (6 decimals)
- Supported currencies: INR, EUR, CNY

#### GET `/currency/balances/:address`
Get all currency balances for a user.

**Response:**
```json
{
  "address": "0x123...",
  "balances": {
    "INR": 5000.50,
    "EUR": 0,
    "CNY": 0
  },
  "formatted": {
    "INR": "5,000.50",
    "EUR": "0.00",
    "CNY": "0.00"
  }
}
```

#### GET `/currency/balance/:currency/:address`
Get single currency balance.

**Response:**
```json
{
  "success": true,
  "currency": "INR",
  "address": "0x123...",
  "balance": 5000.50
}
```

---

### Token Endpoints

#### GET `/token/stock/:stock/balance/:address`
Get stock token balance for a specific stock.

**Example:** `GET /token/stock/GOOG/balance/0x123...`

**Response:**
```json
{
  "success": true,
  "stock": "GOOG",
  "address": "0x123...",
  "balance": 15.0
}
```

**Notes:**
- Balance is in whole stocks (not microunits)
- Supported stocks: GOOG, AAPL, TSLA, NVDA, HOOD

#### GET `/token/currency/:currency/balance/:address`
Get currency balance (alternative to `/currency/balance`).

**Example:** `GET /token/currency/INR/balance/0x123...`

**Response:**
```json
{
  "success": true,
  "currency": "INR",
  "address": "0x123...",
  "balance": 5000.50
}
```

---

### Supported Stocks

| Symbol | Name | Module |
|--------|------|--------|
| GOOG | Google | GOOGCoin |
| AAPL | Apple | AAPLCoin |
| TSLA | Tesla | TSLACoin |
| NVDA | NVIDIA | NVDACoin |
| HOOD | Robinhood | HOODCoin |

---

### Technical Details

#### Token Precision
All tokens use **6 decimal places** (microunits):
- 1 whole token = 1,000,000 microunits
- Example: 10.5 INR = 10,500,000 microunits

#### Price Calculation
- Stock prices are fetched from Yahoo Finance API in USD
- USD prices are converted to INR (1 USD = 90 INR)
- Price per microunit = (USD price × 90 × 1,000,000)
- Contract calculates: `stock_amount = currency_amount / price_per_microunit`

#### BigInt Compatibility
- All blockchain values must be integers
- Division operations use `Math.floor()` to ensure integers
- Prevents "cannot convert to BigInt" errors

---

## 🔧 Smart Contracts

### Contract Address
```
0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d
```

### Available Contracts

#### Currency Tokens
- **INRCoin** (`INRCoin.move`) - Indian Rupee token
- **CNYCoin** (`CNYCoin.move`) - Chinese Yuan token
- **EURCoin** (`EURCoin.move`) - Euro token

#### Stock Tokens
- **GOOGCoin** (`GoogCoin.move`) - Google stock token
- **AAPLCoin** (`ApplCoin.move`) - Apple stock token
- **TSLACoin** (`TslaCoin.move`) - Tesla stock token
- **NVDACoin** (`NvdaCoin.move`) - NVIDIA stock token
- **HOODCoin** (`HoodCoin.move`) - Robinhood stock token

#### Exchange Contracts
- **ExchangeV2** (`ExchangeV2.move`) - Main exchange contract for buying/selling stocks

### Contract Functions

#### View Functions (Read-only)
- `balance_of(account: address)` - Get token balance in microunits
- `get_metadata()` - Get token metadata (name, symbol, decimals)

#### Entry Functions (Transactions)
- `mint()` - Mint currency/stock tokens (admin only, called by backend)
- `buy_stock()` - Purchase stock tokens with currency (admin only, called by backend)
- `sell_stock()` - Sell stock tokens for currency (admin only, called by backend)

**Note**: All transactions are executed by the backend using the admin wallet for security.

## 🎨 Design System

- **Primary Font**: Inter (body text, buttons)
- **Secondary Font**: Poppins (headings, titles)
- **Color Scheme**: 
  - Background: White (#ffffff)
  - Text: Black (#000000)
  - Accent: Green (#00C853)
  - Shadows: Grey (#e0e0e0)

## 🧪 Development

### Build for Production

```bash
cd ssa-frontend
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## 📝 Environment Variables

Currently, no environment variables are required. For production:

- Add your Alpha Vantage API key (if switching from Yahoo Finance)
- Configure backend API endpoints
- Set up CORS proxy or backend proxy

## 🔐 Security Notes

- **Admin Functions**: Most contract functions require admin wallet. Set up a backend service to handle these securely.
- **API Keys**: Never commit API keys to version control. Use environment variables.
- **Wallet Security**: Always verify transactions before signing.

## 🐛 Troubleshooting

### Backend Not Starting
- Ensure `.env` file exists in `backend/` directory
- Verify all environment variables are set correctly
- Check that port 3001 is not already in use
- Run `npm install` in the backend directory

### Frontend Not Connecting to Backend
- Verify backend is running on `http://localhost:3001`
- Check Vite proxy configuration in `vite.config.ts`
- Ensure CORS is enabled in backend (already configured)
- Check browser console for API errors

### Stock Prices Not Loading
- Verify internet connection (Yahoo Finance API requires internet)
- Check browser console for API errors
- Fallback hardcoded prices will be used if API fails
- Prices update every minute automatically

### Wallet Connection Issues
- Ensure wallet extension is installed (Petra, Martian, etc.)
- Check that you're on Aptos Testnet in your wallet
- Try disconnecting and reconnecting wallet
- Refresh the page if connection seems stuck

### Transaction Failures
- Verify you have sufficient APT for gas fees (small amount needed)
- For buy operations: ensure you have enough INR minted
- For sell operations: ensure you own the stocks you're selling
- Check backend logs for detailed error messages
- Verify contract address in `.env` matches deployed contracts

### Balance Not Updating
- Balances auto-update every 5 seconds
- After transactions, balances refresh immediately
- If still not updating, check browser console for errors
- Verify backend `/token/stock/:stock/balance/:address` endpoint is working

### "Cannot Convert to BigInt" Error
- This error has been fixed in the latest version
- Ensure you're using the updated `exchangeService.ts`
- All division operations now use `Math.floor()` for integers
- If error persists, check backend logs for decimal values

### Insufficient Balance Error
- Mint more INR using the "Manage INR" button
- Check your INR balance in the currency header
- For buying: ensure you enter an amount you can afford
- For selling: ensure you own enough stocks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Useful Links

- [Aptos Documentation](https://aptos.dev/)
- [Aptos TS SDK](https://github.com/aptos-labs/aptos-ts-sdk)
- [Move Language](https://move-language.github.io/move/)
- [Material-UI](https://mui.com/)
- [Yahoo Finance](https://finance.yahoo.com/)

## 📧 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Built with ❤️ on Aptos Blockchain**
