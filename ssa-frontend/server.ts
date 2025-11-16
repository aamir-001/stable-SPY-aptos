// express server for api routes


const express = require('express');
const app = express();

const PORT = 3001; // or any other port you prefer

app.use(express.json()); // for parsing JSON requests
app.use(express.urlencoded({ extended: true })); // for parsing URL-encoded requests