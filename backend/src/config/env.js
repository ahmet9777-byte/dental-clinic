/**
 * config/env.js
 *
 * Loads and validates all environment variables at startup.
 * The app will refuse to start if any required variable is missing.
 */

require('dotenv').config();

const REQUIRED = [
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `❌  Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
    `  Copy .env.example to .env and fill in the values.`
  );
  process.exit(1);
}

const env = {
  NODE_ENV  : process.env.NODE_ENV    || 'development',
  PORT      : parseInt(process.env.PORT, 10) || 5000,

  // Database
  DB_HOST     : process.env.DB_HOST     || 'localhost',
  DB_PORT     : parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME     : process.env.DB_NAME,
  DB_USER     : process.env.DB_USER,
  DB_PASSWORD : process.env.DB_PASSWORD,

  // Auth
  JWT_SECRET     : process.env.JWT_SECRET,
  JWT_EXPIRES_IN : process.env.JWT_EXPIRES_IN || '24h',

  // n8n
  N8N_WEBHOOK_URL : process.env.N8N_WEBHOOK_URL || '',

  // CORS
  CLIENT_URL : process.env.CLIENT_URL || 'http://localhost:3000',

  // Helpers
  isDev  : (process.env.NODE_ENV || 'development') === 'development',
  isProd : process.env.NODE_ENV === 'production',
};

module.exports = env;
