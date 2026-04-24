/**
 * server.js
 *
 * Application entry point.
 *
 * Start order:
 *   1. Load env  →  fail fast if variables are missing
 *   2. Connect to PostgreSQL
 *   3. Bind HTTP server
 *   4. Register graceful-shutdown handlers (SIGTERM / SIGINT)
 */

const env         = require('./src/config/env');     // validates env vars first
const { connectDB } = require('./src/config/db');
const app         = require('./src/app');

let server;

const start = async () => {
  // ── 1. Database ─────────────────────────────────────────────────────────
  await connectDB();

  // ── 2. HTTP server ───────────────────────────────────────────────────────
  server = app.listen(env.PORT, () => {
    console.log(
      `🚀  Dental Clinic API running in [${env.NODE_ENV}] mode on port ${env.PORT}`
    );
    console.log(`   Health check → http://localhost:${env.PORT}/api/health`);
  });

  // Surface unhandled promise rejections as proper server errors
  server.on('error', (err) => {
    console.error('❌  Server error:', err);
    process.exit(1);
  });
};

// ─── Graceful shutdown ────────────────────────────────────────────────────

const shutdown = (signal) => {
  console.log(`\n⚠️   ${signal} received — shutting down gracefully…`);

  if (!server) process.exit(0);

  server.close(() => {
    console.log('✅  HTTP server closed.');
    // Sequelize connection pool is released automatically on process exit.
    process.exit(0);
  });

  // Force-exit if shutdown takes longer than 10 s
  setTimeout(() => {
    console.error('❌  Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('❌  Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  console.error('❌  Uncaught Exception:', err);
  shutdown('uncaughtException');
});

// ─── Boot ─────────────────────────────────────────────────────────────────
start();
