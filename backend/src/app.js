/**
 * app.js
 *
 * Creates and configures the Express application.
 * Kept separate from server.js so it can be imported cleanly
 * in tests without binding to a port.
 *
 * Middleware order matters — the sequence below is intentional:
 *   1. Security headers   (Helmet)
 *   2. CORS               (must be before any route)
 *   3. Body parsers
 *   4. Request logger     (Morgan)
 *   5. API routes
 *   6. 404 handler        (after routes, before error handler)
 *   7. Global error handler (must be last, 4-arg signature)
 */

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const env                              = require('./config/env');
const apiRoutes                        = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ─── 1. Security headers ──────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy : { policy: 'cross-origin' },
    contentSecurityPolicy     : false,   // managed by Next.js on the frontend
  })
);

// ─── 2. CORS ──────────────────────────────────────────────────────────────
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (health checks, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed.`));
    },
    credentials    : true,
    methods        : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders : ['Content-Type', 'Authorization'],
  })
);

// ─── 3. Body parsers ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));        // reject huge JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── 4. HTTP request logger ───────────────────────────────────────────────
if (env.isDev) {
  // Colourised output in development
  app.use(morgan('dev'));
} else {
  // Structured (Combined) log in production — redirect to your log aggregator
  app.use(morgan('combined'));
}

// ─── 5. API routes ────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── 6. 404 — unknown routes ──────────────────────────────────────────────
app.use(notFoundHandler);

// ─── 7. Global error handler ──────────────────────────────────────────────
// Must be registered last and must have exactly 4 parameters.
app.use(errorHandler);

module.exports = app;
