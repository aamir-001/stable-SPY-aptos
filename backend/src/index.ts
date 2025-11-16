import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import exchangeRoutes from "./routes/exchangeRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/exchange", exchangeRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening at http://localhost:${PORT}`);
});
