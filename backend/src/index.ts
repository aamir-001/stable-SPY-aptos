import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import exchangeRoutes from "./routes/exchangeRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";

dotenv.config();

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Stock Exchange API is running",
    version: "1.0.0",
    endpoints: {
      exchange: "/exchange - Buy/Sell stocks",
      currency: "/currency - Mint/Burn/Balance currencies (INR, EUR, CNY)",
      token: "/token - Get token balances (stocks and currencies)"
    }
  });
});

// Routes
app.use("/exchange", exchangeRoutes);
app.use("/currency", currencyRoutes);
app.use("/token", tokenRoutes);

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Backend listening at http://localhost:${PORT}`);
  console.log(`📊 Exchange API: http://localhost:${PORT}/exchange`);
  console.log(`💰 Currency API: http://localhost:${PORT}/currency`);
  console.log(`🪙 Token API: http://localhost:${PORT}/token`);
  console.log(`✅ Server is ready to accept connections`);
});

// Prevent the server from closing
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});