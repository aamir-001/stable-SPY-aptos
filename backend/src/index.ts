import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import exchangeRoutes from "./routes/exchangeRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";

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
      currency: "/currency - Mint/Burn/Balance currencies (INR, EUR, CNY)"
    }
  });
});

// Routes
app.use("/exchange", exchangeRoutes);
app.use("/currency", currencyRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening at http://localhost:${PORT}`);
  console.log(`📊 Exchange API: http://localhost:${PORT}/exchange`);
  console.log(`💰 Currency API: http://localhost:${PORT}/currency`);
});