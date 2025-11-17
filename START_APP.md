# 🚀 Quick Start Guide

## Starting the Application

You need to run **TWO** terminals simultaneously:

### Terminal 1: Start Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 Backend listening at http://localhost:3001
📊 Exchange API: http://localhost:3001/exchange
💰 Currency API: http://localhost:3001/currency
```

---

### Terminal 2: Start Frontend Server

```bash
cd ssa-frontend
npm run dev
```

**Expected output:**
```
VITE v7.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

---

## Access the Application

Open your browser and go to: **http://localhost:3000**

---

## PowerShell Commands (Windows)

### Option 1: Two Separate PowerShell Windows

**PowerShell Window 1:**
```powershell
cd D:\Aptos\stable-SPY-aptos\backend
npm run dev
```

**PowerShell Window 2:**
```powershell
cd D:\Aptos\stable-SPY-aptos\ssa-frontend
npm run dev
```

---

### Option 2: Use Start-Process to Run in Background

```powershell
# From the project root directory
cd D:\Aptos\stable-SPY-aptos

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait 3 seconds for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ssa-frontend; npm run dev"
```

---

## Verify Everything is Working

### 1. Check Backend Health
Open browser or use curl:
```bash
curl http://localhost:3001/
```

Should return:
```json
{
  "status": "OK",
  "message": "Stock Exchange API is running",
  "version": "1.0.0"
}
```

### 2. Check Frontend
Open: http://localhost:3000

You should see the Stock Exchange UI with:
- Wallet connection button
- Stock price charts
- Balance information
- Buy/Sell buttons

---

## Troubleshooting

### Issue: "Port 3001 already in use"
**Solution:** Kill the process using port 3001
```powershell
# Find process on port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: "Port 3000 already in use"
**Solution:** Kill the process using port 3000
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: Backend not responding
**Check:**
1. Is backend running? Check Terminal 1
2. Is `.env` file configured in backend folder?
3. Do you have `ADMIN_PRIVATE_KEY` in `.env`?

### Issue: Frontend shows connection errors
**Check:**
1. Is backend running on port 3001?
2. Check browser console for errors (F12)
3. Check Network tab for failed API calls

---

## Environment Variables

### Backend (.env file required)

Create a file: `backend/.env`

```env
# Required
ADMIN_PRIVATE_KEY=your_private_key_here
MODULE_ADDR=0x2058eb9a877b62d20e5ac86550366bc21308c31affdbe1007693dd4f64ee762d

# Optional
PORT=3001
NETWORK=testnet
```

---

## Stopping the Servers

Press `Ctrl+C` in each terminal window to stop the servers.

Or if running in background:
```powershell
# Stop all Node processes (use with caution)
taskkill /F /IM node.exe
```

---

## Next Steps

1. **Connect Wallet**: Click "Connect Wallet" button
2. **Mint Currency**: Click on INR balance → Mint some INR
3. **Buy Stocks**: Click "Buy Stock" → Select stock → Enter amount → Buy
4. **View Balances**: Click on any currency to see detailed balance

Enjoy trading! 🎉
