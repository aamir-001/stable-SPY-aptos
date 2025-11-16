import express from 'express';

const app = express();
const PORT = 3001; // or any other port you prefer

app.use(express.json()); // for parsing JSON requests
app.use(express.urlencoded({ extended: true })); // for parsing URL-encoded requests

// API routes here...

const ADMIN_KEY = process.env.ADMIN_KEY || "default_admin_key";

app.get('/api/exchange-coins', (req, res) => {
  // Return some data or handle the request...
  // teh request should contain the coin name
  // sign it using the utils in aptos client
  console.log("API HIT");
  return res.json({ message: 'Youve hit the Exchange coins endpoint'});
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

