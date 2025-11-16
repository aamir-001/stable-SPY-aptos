import express from "express";
import { buyStock, sellStock } from "../controllers/exchangeController.js";

const router = express.Router();

router.post("/buy", buyStock);
router.post("/sell", sellStock);

export default router;
