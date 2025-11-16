import express, { Request, Response } from 'express';
const app = express();
const PORT = 3001; // or any other port you prefer

app.use(express.json()); // for parsing JSON requests
app.use(express.urlencoded({ extended: true })); // for parsing URL-encoded requests

// API routes here...

const ADMIN_KEY = process.env.ADMIN_KEY || "default_admin_key";

app.get('/api/data', (req: Request, res: Response) => {
  // Return some data or handle the request...
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});