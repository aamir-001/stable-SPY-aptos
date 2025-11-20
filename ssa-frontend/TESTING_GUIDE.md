# Testing Guide - Frontend with Backend Integration

## ✅ Verification Checklist

The frontend has been successfully updated to use backend endpoints. Here's what's been integrated:

### 1. **API Service Layer**
- ✅ `src/services/backendApi.ts` - Centralized API service
- ✅ All endpoints use `/api` prefix (proxied by Vite to `http://localhost:3001`)

### 2. **Components Using Backend API**

| Component | Backend Endpoint | Status |
|-----------|------------------|--------|
| **BuyStockModal.tsx** | `POST /api/exchange/buy` | ✅ Connected |
| **INRModal.tsx** | `POST /api/currency/mint`<br>`GET /api/currency/balance/INR/:address` | ✅ Connected |
| **BalanceModal.tsx** | `GET /api/currency/balance/:currency/:address` | ✅ Connected |
| **App.tsx** | `GET /api/currency/balances/:address` | ✅ Connected |

### 3. **Removed Dependencies**
- ✅ `mockApi.ts` - Deleted
- ✅ Direct blockchain currency queries - Replaced with backend API
- ✅ Old `server.js` endpoints - Deprecated

---

## 🚀 Running the Application

### Step 1: Start Backend Server
```bash
cd backend
npm install
npm run dev
```

**Expected Output:**
```
🚀 Backend listening at http://localhost:3001
📊 Exchange API: http://localhost:3001/exchange
💰 Currency API: http://localhost:3001/currency
```

### Step 2: Start Frontend Server
```bash
cd ssa-frontend
npm install
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

---

## 🧪 Testing Scenarios

### Test 1: Buy Stock
1. **Open the app** at `http://localhost:3000`
2. **Connect your Aptos wallet**
3. **Click "Buy Stock"** button
4. **Select a stock** (e.g., GOOGC, AAPL)
5. **Enter amount in INR** (e.g., 10000)
6. **Click "Buy Stock"**

**Expected Behavior:**
- Backend fetches real-time stock price from Yahoo Finance
- Converts USD price to INR (1 USD = 90 INR)
- Calculates how many stocks you can buy
- Executes blockchain transaction
- Shows success message with transaction hash

**API Call Flow:**
```
Frontend → POST /api/exchange/buy
         → { userAddress, stock: "GOOGC", amount: 10000 }
Backend  → Yahoo Finance API (get stock price)
         → Aptos Blockchain (execute buy transaction)
         → Response: { success, txHash, stockAmount, pricePerStock, totalSpent }
```

### Test 2: Mint Currency
1. **Click on INR balance**
2. **Enter amount to mint** (e.g., 50000)
3. **Click "Mint INR"**

**Expected Behavior:**
- Backend mints INR tokens to your wallet
- Balance updates automatically
- Shows transaction hash

**API Call Flow:**
```
Frontend → POST /api/currency/mint
         → { currency: "INR", userAddress, amount: 50000 }
Backend  → Aptos Blockchain (execute mint transaction)
         → Response: { success, txHash, currency, amount, scaledAmount }
```

### Test 3: View Balances
1. **Connect wallet**
2. **Balances load automatically**
3. **Click on any currency balance** to see details

**Expected Behavior:**
- APT balance: Direct blockchain query
- INR/EUR/CNY balances: Backend API call (batch fetch)
- All balances displayed in human-readable format

**API Call Flow:**
```
Frontend → GET /api/currency/balances/:address
Backend  → Aptos Blockchain (query all currency balances)
         → Response: { address, balances: { INR, EUR, CNY }, formatted }
```

---

## 🔍 Debugging

### Check Backend Logs
```bash
cd backend
npm run dev
```
Watch for:
- `[MINT CURRENCY]` - Minting operations
- `[BALANCE]` - Balance queries
- `[BUY STOCK]` - Stock purchase operations
- Any error messages

### Check Frontend Network Requests
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Filter by `api`
4. Perform actions (buy, mint, etc.)
5. Check request/response data

**Expected Endpoints:**
- `POST http://localhost:3000/api/exchange/buy`
- `POST http://localhost:3000/api/currency/mint`
- `GET http://localhost:3000/api/currency/balances/:address`
- `GET http://localhost:3000/api/currency/balance/:currency/:address`

### Common Issues

#### Issue 1: "Backend is not responding"
**Solution:** Make sure backend is running on port 3001
```bash
cd backend
npm run dev
```

#### Issue 2: CORS Error
**Solution:** Backend already has CORS enabled for all origins:
```typescript
app.use(cors({ origin: '*' }))
```

#### Issue 3: "Failed to fetch balance"
**Possible Causes:**
- Backend not running
- Wallet not connected
- Invalid wallet address
- Backend environment variables not set

**Check backend .env:**
```
ADMIN_PRIVATE_KEY=your_private_key
MODULE_ADDR=0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d
NETWORK=testnet
```

#### Issue 4: Transaction Fails
**Possible Causes:**
- Insufficient balance
- Invalid stock symbol
- Network issues
- Backend private key not set

---

## 📊 API Response Examples

### Buy Stock Response
```json
{
  "success": true,
  "txHash": "0x1234567890abcdef...",
  "stockAmount": 5.5,
  "pricePerStock": 14850.0,
  "totalSpent": 81675.0,
  "change": 0
}
```

### Mint Currency Response
```json
{
  "success": true,
  "txHash": "0xabcdef1234567890...",
  "currency": "INR",
  "amount": 50000,
  "scaledAmount": 50000000000
}
```

### Get Balances Response
```json
{
  "address": "0x123...",
  "balances": {
    "INR": 50000.0,
    "EUR": 0.0,
    "CNY": 0.0
  },
  "formatted": {
    "INR": "₹50000.00",
    "EUR": "€0.00",
    "CNY": "¥0.00"
  }
}
```

---

## 🎯 Integration Points Summary

### Frontend → Backend Communication
```
[Frontend Components]
        ↓
[backendApi.ts Service]
        ↓
[Vite Proxy: /api → localhost:3001]
        ↓
[Backend Express Server]
        ↓
[Aptos Blockchain]
```

### Supported Operations
1. ✅ Buy Stocks (GOOG, AAPL, TSLA, NVDA, HOOD)
2. ✅ Mint Currency (INR, EUR, CNY)
3. ✅ Get Single Currency Balance
4. ✅ Get All Currency Balances (batch)
5. ✅ Real-time Stock Prices (Yahoo Finance)
6. ✅ Automatic USD to INR Conversion

---

## 📝 Notes

- **Stock Prices**: Fetched in real-time from Yahoo Finance API
- **Currency Conversion**: 1 USD = 90 INR (hardcoded in backend)
- **Scaling**: All amounts scaled by 1,000,000 for blockchain precision
- **Transaction Signing**: Backend uses admin private key (never exposed to frontend)
- **Security**: All transactions signed server-side, frontend only sends parameters
