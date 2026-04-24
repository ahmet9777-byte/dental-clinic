/**
 * controllers/authController.js
 *
 * Handles all authentication flows:
 *   register       POST /api/auth/register
 *   login          POST /api/auth/login
 *   getMe          GET  /api/auth/me           (protected)
 *   updateProfile  PATCH /api/auth/me          (protected)
 *   changePassword PATCH /api/auth/me/password (protected)
 */

const bcrypt      = require('bcrypt');
const jwt         = require('jsonwebtoken');
const { Op }      = require('sequelize');

const { User, Doctor } = require('../models');
const env              = require('../config/env');
const asyncHandler     = require('../utils/asyncHandler');
const { success }      = require('../utils/response');
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  AppError,
} = require('../middleware/errorHandler');

const SALT_ROUNDS = 10;

// ─── Helper: sign JWT ──────────────────────────────────────────────────────

const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

// ─── Helper: safe user shape ───────────────────────────────────────────────
// Returns only the fields we ever want to expose in API responses.

const safeUser = (user, doctorProfile = null) => {
  const base = {
    id        : user.id,
    name      : user.name,
    email     : user.email,
    role      : user.role,
    phone     : user.phone     ?? null,
    avatarUrl : user.avatarUrl ?? null,
    isActive  : user.isActive,
    createdAt : user.createdAt,
  };
  if (doctorProfile) {
    base.doctorProfile = {
      id              : doctorProfile.id,
      specialization  : doctorProfile.specialization,
      bio             : doctorProfile.bio,
      yearsExperience : doctorProfile.yearsExperience,
      isAvailable     : doctorProfile.isAvailable,
    };
  }
  return base;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Duplicate email check (friendlier message than DB constraint)
  const existing = await User.unscoped().findOne({ where: { email } });
  if (existing) {
    throw new ConflictError('An account with this email address already exists.');
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    password : hashed,
    phone    : phone ?? null,
    role     : 'patient',   // registration is always patient-only
  });

  const token = signToken(user.id, user.role);

  return success(
    res,
    { token, user: safeUser(user) },
    'Account created successfully.',
    201
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Use withPassword scope to retrieve the hash
 const user = await User.unscoped().findOne({
    where: { email },
  });

  // Generic message — don't reveal whether the email exists
  const invalidMsg = 'Incorrect email or password.';

  if (!user) throw new UnauthorizedError(invalidMsg);
  if (!user.isActive) throw new UnauthorizedError('This account has been deactivated.');

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw new UnauthorizedError(invalidMsg);

  // Fetch doctor profile if the user is a doctor
  let doctorProfile = null;
  if (user.role === 'doctor') {
    doctorProfile = await Doctor.findOne({ where: { userId: user.id } });
  }

  const token = signToken(user.id, user.role);

  return success(
    res,
    { token, user: safeUser(user, doctorProfile) },
    'Logged in successfully.'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me   (requires protect middleware)
// ─────────────────────────────────────────────────────────────────────────────

const getMe = asyncHandler(async (req, res) => {
  // req.user is already attached by protect() — just enrich with doctor profile
  let doctorProfile = null;
  if (req.user.role === 'doctor') {
    doctorProfile = await Doctor.findOne({ where: { userId: req.user.id } });
  }

  return success(res, safeUser(req.user, doctorProfile), 'Profile retrieved.');
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/me   (requires protect middleware)
// ─────────────────────────────────────────────────────────────────────────────

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatarUrl } = req.body;

  // Only allow whitelisted fields to prevent mass-assignment
  const updates = {};
  if (name      !== undefined) updates.name      = name;
  if (phone     !== undefined) updates.phone     = phone;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields provided for update.', 400, 'NO_FIELDS');
  }

  // Check for email collision only if email is being changed
  if (updates.email) {
    const collision = await User.unscoped().findOne({
      where: { email: updates.email, id: { [Op.ne]: req.user.id } },
    });
    if (collision) throw new ConflictError('This email is already in use.');
  }

  await req.user.update(updates);
  await req.user.reload();

  return success(res, safeUser(req.user), 'Profile updated successfully.');
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/me/password   (requires protect middleware)
// ─────────────────────────────────────────────────────────────────────────────

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Retrieve the hash — req.user comes from the default scope (no password)
  const userWithPw = await User.unscoped().findByPk(req.user.id);
  if (!userWithPw) throw new NotFoundError('User');

  const match = await bcrypt.compare(currentPassword, userWithPw.password);
  if (!match) throw new UnauthorizedError('Current password is incorrect.');

  if (currentPassword === newPassword) {
    throw new AppError(
      'New password must be different from the current password.',
      400,
      'SAME_PASSWORD'
    );
  }

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userWithPw.update({ password: hashed });

  // Issue a fresh token so the client does not need to re-login
  const token = signToken(req.user.id, req.user.role);

  return success(res, { token }, 'Password changed successfully.');
});

module.exports = { register, login, getMe, updateProfile, changePassword };
