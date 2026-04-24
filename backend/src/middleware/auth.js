/**
 * middleware/auth.js
 *
 * Two composable middleware functions:
 *
 *  1. protect        — verifies the JWT and attaches req.user
 *  2. restrictTo()   — RBAC guard; call after protect()
 *
 * Usage examples:
 *
 *   // Any authenticated user
 *   router.get('/profile', protect, controller.getProfile);
 *
 *   // Secretary only
 *   router.get('/appointments', protect, restrictTo('secretary'), controller.getAll);
 *
 *   // Doctor or Secretary
 *   router.get('/schedule', protect, restrictTo('doctor', 'secretary'), controller.schedule);
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const env = require('../config/env');
const {
  UnauthorizedError,
  ForbiddenError,
} = require('./errorHandler');

// ─── Helper: extract bearer token ─────────────────────────────────────────

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

// ─── protect ──────────────────────────────────────────────────────────────

const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next(new UnauthorizedError('No token provided. Please log in.'));
    }

    // Verify — throws JsonWebTokenError / TokenExpiredError on failure
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Fetch fresh user to catch deactivated accounts
    const user = await User.findOne({
      where: { id: decoded.id, isActive: true },
    });

    if (!user) {
      return next(
        new UnauthorizedError('The account belonging to this token no longer exists.')
      );
    }

    req.user = user;          // attach to request for downstream middleware
    return next();
  } catch (err) {
    return next(err);         // JWT errors normalised in errorHandler.js
  }
};

// ─── restrictTo ───────────────────────────────────────────────────────────

/**
 * @param {...string} roles - allowed roles e.g. 'secretary', 'doctor'
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  if (!roles.includes(req.user.role)) {
    return next(
      new ForbiddenError(
        `This action requires one of the following roles: ${roles.join(', ')}.`
      )
    );
  }

  return next();
};

module.exports = { protect, restrictTo };
