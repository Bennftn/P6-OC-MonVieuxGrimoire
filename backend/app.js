const auth = require('./middleware/auth');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');

const app = express();

// DB
mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB })
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error(err));

// Middlewares globaux
app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(cors());

// Anti-bruteforce sur /api/auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);

// test du midlleware auth
app.get('/api/me', auth, (req, res) => {
  res.json({ userId: req.auth.userId });
});

// Gestion d’erreurs 404
app.use((req, res) => res.status(404).json({ message: 'Route introuvable.' }));

module.exports = app;
