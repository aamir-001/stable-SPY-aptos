# Frontend Migration Notes

## Overview
The frontend has been updated to use the backend server located in `../backend` instead of the local `server.js` file.

## Changes Made

### 1. New Backend API Service
- **File**: `src/services/backendApi.ts`
- **Purpose**: Centralized API service for all backend communication
- **Endpoints**:
  - `POST /api/exchange/buy` - Buy stocks
  - `POST /api/exchange/sell` - Sell stocks
  - `POST /api/currency/mint` - Mint currency (INR, EUR, CNY)
  - `GET /api/currency/balances/:address` - Get all currency balances
  - `GET /api/currency/balance/:currency/:address` - Get single currency balance

### 2. Updated Components
- **BuyStockModal.tsx**: Now uses `backendApi.buyStock()` instead of mock API
- **INRModal.tsx**: Now uses `backendApi.mintCurrency()` and `backendApi.getCurrencyBalance()`
- **BalanceModal.tsx**: Now uses `backendApi.getCurrencyBalance()` for currency balances
- **App.tsx**: Now uses `backendApi.getCurrencyBalances()` for fetching all balances

### 3. Removed Files
- `src/services/mockApi.ts` - No longer needed
- `src/utils/getINRBalance.ts` - Replaced by backend API
- `src/utils/getCNYBalance.ts` - Replaced by backend API
- `src/utils/getEURBalance.ts` - Replaced by backend API
- `src/utils/buyStock.ts` - Replaced by backend API
- `src/utils/mintINR.ts` - Replaced by backend API
- `src/utils/calculateBuyAmount.ts` - Replaced by backend API

### 4. Deprecated Files
- `server.js` - Deprecated in favor of `../backend`
- `server-utils/` - No longer used

## Running the Application

### Prerequisites
1. Backend server must be running
2. Backend must be configured with proper environment variables

### Start Commands

**Terminal 1 - Backend:**
```bash
cd ../backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

### Configuration
- **Vite Proxy**: The frontend proxies `/api` requests to `http://localhost:3001` (backend)
- **Backend Port**: Default is 3001 (configurable via `PORT` environment variable)
- **Frontend Port**: Default is 3000 (configurable via `VITE_DEV_SERVER_PORT`)

## API Flow

```
Frontend Component
    ↓
backendApi.ts (Service Layer)
    ↓
Vite Proxy (/api → http://localhost:3001)
    ↓
Backend Express Server (../backend)
    ↓
Aptos Blockchain
```

## Backend Features

### Stock Trading
- Automatic price fetching from Yahoo Finance
- USD to INR conversion (1 USD = 90 INR)
- Price scaling for blockchain precision
- Support for: GOOG, AAPL, TSLA, NVDA, HOOD

### Currency Management
- Mint currency to user accounts
- Get balances for INR, EUR, CNY
- Automatic scaling (1,000,000 microunits = 1 currency unit)

### Smart Contract Integration
- Uses admin private key for signing transactions
- Supports testnet and mainnet (configurable)
- Module address: `0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d`

## Notes
- The frontend still uses direct blockchain calls for APT balance (via `getAccountAPTBalance`)
- All currency operations (INR, EUR, CNY) now go through the backend
- Stock prices are fetched in real-time from Yahoo Finance via the backend
