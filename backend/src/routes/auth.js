/**
 * routes/auth.js
 *
 * Public  POST /api/auth/register
 * Public  POST /api/auth/login
 * Private GET  /api/auth/me
 * Private PATCH /api/auth/me
 * Private PATCH /api/auth/me/password
 */

const router = require('express').Router();

const authController = require('../controllers/authController');
const { protect }    = require('../middleware/auth');
const { validate }   = require('../middleware/validate');
const {
  registerRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
} = require('../validators/authValidators');

// ── Public ────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/register
 * @desc    Create a new patient account
 * @access  Public
 * @body    { name, email, password, phone? }
 * @returns { token, user }
 */
router.post(
  '/register',
  registerRules,
  validate(),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 * @body    { email, password }
 * @returns { token, user }
 */
router.post(
  '/login',
  loginRules,
  validate(),
  authController.login
);

// ── Protected (JWT required) ──────────────────────────────────────────────

/**
 * @route   GET /api/auth/me
 * @desc    Return the currently authenticated user's profile
 * @access  Private (all roles)
 */
router.get('/me', protect, authController.getMe);

/**
 * @route   PATCH /api/auth/me
 * @desc    Update name, phone, or avatar URL
 * @access  Private (all roles)
 * @body    { name?, phone?, avatarUrl? }
 */
router.patch(
  '/me',
  protect,
  updateProfileRules,
  validate(),
  authController.updateProfile
);

/**
 * @route   PATCH /api/auth/me/password
 * @desc    Change password — requires current password for verification
 * @access  Private (all roles)
 * @body    { currentPassword, newPassword, confirmNewPassword }
 * @returns { token }   fresh JWT issued after password change
 */
router.patch(
  '/me/password',
  protect,
  changePasswordRules,
  validate(),
  authController.changePassword
);

// ── Staff portal login ────────────────────────────────────────────────────
const { staffLogin } = require('../controllers/staffAuthController');

/**
 * @route   POST /api/auth/staff/login
 * @desc    Secretary or Doctor login — patients are rejected
 * @access  Public
 * @body    { email, password }
 * @returns { token, user }   user includes doctorProfile for doctors
 */
router.post(
  '/staff/login',
  loginRules,      // same email/password rules
  validate(),
  staffLogin
);

module.exports = router;
