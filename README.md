# TABDEEL - Stable SPY Aptos

A modern decentralized finance (DeFi) platform built on Aptos blockchain that allows users to exchange cryptocurrencies for stable currencies (INR, USD, CNY, EUR) and purchase stock tokens representing real-world assets.

## 🚀 Features

- **Real-Time Stock Prices**: Live stock market data from Yahoo Finance API
- **Currency Exchange**: Convert APT tokens to stable currencies (INR, USD, CNY, EUR)
- **Stock Token Trading**: Purchase stock tokens (Google, Apple, Tesla, NVIDIA, Robinhood) using stable currencies
- **Wallet Integration**: Seamless Aptos wallet connection and management
- **Interactive Charts**: Real-time intraday price charts for selected stocks
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

### Smart Contracts
- **Move** - Aptos smart contract language
- **Aptos Framework** - Standard library

### APIs
- **Yahoo Finance API** - Stock market data (free, no API key required)
- **Mock API** - Fallback data for development

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
│   │   ├── Stock-tokens/    # Stock token contracts (GOOGL, AAPL, TSLA, etc.)
│   │   └── Utilities/       # Exchange contracts
│   └── Move.toml
├── ssa-frontend/            # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/       # API services (stockApi, mockApi)
│   │   ├── utils/          # Utility functions (Aptos client, contract calls)
│   │   └── App.tsx         # Main application component
│   └── package.json
└── README.md
```

## 🚀 Getting Started

## Installation

To install the dependencies, run:
```bash
npm install
```

## Running the application

To start the frontend server, run:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser to view the application.

## Running the backend server

To start the Express.js backend server, run:
```bash
node server.ts
```
Make sure to update your Vite configuration file (`vite.config.ts`) to include the following settings:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  // ... other configurations ...
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.VITE_DEV_SERVER_PORT),
    proxy: {
      '/api': 'http://localhost:3001', // adjust the path and backend URL as needed
    },
  },
});
```

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stable-SPY-aptos
```

### 2. Install Dependencies

```bash
cd ssa-frontend
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in terminal).

### 4. Connect Your Wallet

1. Install an Aptos wallet extension (Petra, Martian, etc.)
2. Click "Connect Wallet" in the top right corner
3. Select your wallet and approve the connection

## 📱 Usage Guide

### Viewing Stock Prices

1. The main dashboard displays stock prices front and center
2. Select a stock from the dropdown (Google, Apple, Tesla, NVIDIA, Robinhood)
3. View real-time price, change percentage, and intraday chart
4. Prices update automatically every minute

### Currency Exchange

1. Select a currency (USD, INR, CNY, EUR) from the dropdown
2. View your converted balance
3. Click "Manage INR Coin" to interact with INR tokens
4. Use "View Balance" to check your APT balance

### Purchasing Stock Tokens

1. Select a stock from the stock prices section
2. Click "Buy [Stock] Coins" button
3. In the modal:
   - Select currency (INR, CNY, EUR)
   - Enter currency amount
   - Enter stock price
   - Click "Calculate Stock Amount" to preview
   - Click "Buy Stock" to execute (requires admin wallet for now)

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
- **GoogleCoin** (`GoogCoin.move`) - Google stock token
- **ApplCoin** (`ApplCoin.move`) - Apple stock token
- **TslaCoin** (`TslaCoin.move`) - Tesla stock token
- **NvdaCoin** (`NvdaCoin.move`) - NVIDIA stock token
- **HoodCoin** (`HoodCoin.move`) - Robinhood stock token

#### Exchange Contracts
- **ExchangeV2** (`ExchangeV2.move`) - Main exchange contract for buying/selling stocks

### Contract Functions

#### View Functions (Read-only)
- `balance_of(account: address)` - Get token balance
- `get_metadata()` - Get token metadata
- `calculate_buy_amount()` - Calculate stock amount from currency
- `calculate_sell_amount()` - Calculate currency from stock amount

#### Entry Functions (Transactions)
- `mint_inrc()` - Mint INR tokens (admin only)
- `buy_stock()` - Purchase stock tokens with currency (admin only)
- `sell_stock()` - Sell stock tokens for currency (admin only)

**Note**: Currently, most transaction functions require admin privileges. In production, these should be called through a backend API.

## 🔌 API Services

### Stock API (`services/stockApi.ts`)
- Fetches real-time stock prices from Yahoo Finance
- Uses CORS proxy for browser compatibility
- Includes fallback data if API fails
- Updates every minute

### Mock API (`services/mockApi.ts`)
- Provides mock data for development
- Simulates contract interactions
- Returns mock transaction hashes and balances

**For Production**: Replace mock API calls with your backend endpoints.

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

### Stock Prices Not Loading
- Check browser console for CORS errors
- Verify internet connection
- Fallback data will display if API fails

### Wallet Connection Issues
- Ensure wallet extension is installed
- Check that you're on Aptos Testnet
- Try refreshing the page

### Transaction Failures
- Verify you have sufficient APT for gas fees
- Check that you're using the admin wallet (for mint/buy functions)
- Review contract address matches your deployment

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
