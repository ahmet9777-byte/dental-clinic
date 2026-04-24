/**
 * middleware/errorHandler.js
 *
 * Centralised error handler.  Must be registered LAST in app.js
 * (after all routes) so Express routes errors here via next(err).
 *
 * All controllers should use next(err) — never res.status().json()
 * directly for error paths — so every error surface is uniform.
 */

const env = require('../config/env');

// ─── Typed application errors ──────────────────────────────────────────────

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;   // flag: "we know about this error"
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 422, 'VALIDATION_ERROR');
    this.errors = errors;        // array of field-level issues
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found.`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message = 'A conflict occurred with existing data.') {
    super(message, 409, 'CONFLICT');
  }
}

// ─── Sequelize error normaliser ────────────────────────────────────────────

const normaliseSequelizeError = (err) => {
  // Unique constraint violation
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map((e) => e.path).join(', ');
    return new ConflictError(`Duplicate value for: ${fields}.`);
  }

  // Validation errors from model validators
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field   : e.path,
      message : e.message,
    }));
    return new ValidationError('Validation failed.', errors);
  }

  // Foreign key violations
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return new AppError('Related record not found.', 400, 'FK_CONSTRAINT');
  }

  // Connection / dialect errors
  if (err.name === 'SequelizeConnectionError') {
    return new AppError('Database connection error.', 503, 'DB_CONNECTION');
  }

  return null;   // not a Sequelize error — let the main handler deal with it
};

// ─── JWT error normaliser ─────────────────────────────────────────────────

const normaliseJwtError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token. Please log in again.');
  }
  if (err.name === 'TokenExpiredError') {
    return new UnauthorizedError('Your session has expired. Please log in again.');
  }
  return null;
};

// ─── Global error handler ──────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Try to normalise third-party errors into our AppError format
  const normalisedErr =
    normaliseSequelizeError(err) ||
    normaliseJwtError(err) ||
    err;

  const statusCode = normalisedErr.statusCode || 500;
  const code       = normalisedErr.code       || 'INTERNAL_ERROR';
  const message    = normalisedErr.message    || 'An unexpected error occurred.';

  // Only log stack traces for unexpected (non-operational) errors
  if (!normalisedErr.isOperational || env.isDev) {
    console.error(`[${new Date().toISOString()}] ${statusCode} ${code}:`, err);
  }

  const body = {
    success : false,
    code,
    message,
  };

  // Attach field-level errors for validation failures
  if (normalisedErr instanceof ValidationError && normalisedErr.errors.length) {
    body.errors = normalisedErr.errors;
  }

  // Attach stack only in development for easier debugging
  if (env.isDev) {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
};

// ─── 404 handler (must be placed before errorHandler in app.js) ───────────

const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
};
