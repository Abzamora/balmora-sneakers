require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

connectDB();

const app = express();

// ---- Global middleware -----------------------------------------------------
app.use(helmet()); // sensible security headers
app.use(express.json({ limit: '2mb' })); // JSON bodies (image files bypass this via multer)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Only allow the configured frontend origin(s) to call the API with credentials
const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
  })
);

// Basic brute-force protection on the login endpoint specifically
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login', loginLimiter);

// ---- Routes -----------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// ---- Error handling (must be last) ------------------------------------------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API listening on port ${PORT} [${process.env.NODE_ENV}]`));
