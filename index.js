const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://beastfps.github.io',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/photos',   require('./routes/photos'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/about',    require('./routes/about'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running ✅' });
});

app.get('/api/debug', (req, res) => {
  res.json({
    email: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });