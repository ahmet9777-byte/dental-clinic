/**
 * validators/authValidators.js
 *
 * express-validator rule chains for every auth endpoint.
 * Imported by the auth router and spread into the middleware array.
 *
 * Usage in routes/auth.js:
 *   router.post('/register', registerRules, validate(), controller.register);
 */

const { body } = require('express-validator');

// ─── Shared rules ──────────────────────────────────────────────────────────

const emailRule = () =>
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail();

const passwordRule = (field = 'password') =>
  body(field)
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/\d/).withMessage('Password must contain at least one number.');

const phoneRule = () =>
  body('phone')
    .optional({ nullable: true })
    .trim()
    .matches(/^[+\d\s\-().]{7,20}$/)
    .withMessage('Please provide a valid phone number.');

// ─── Register ─────────────────────────────────────────────────────────────

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 120 })
    .withMessage('Name must be between 2 and 120 characters.'),

  emailRule(),
  passwordRule('password'),
  phoneRule(),
];

// ─── Login ────────────────────────────────────────────────────────────────

const loginRules = [
  emailRule(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ─── Update profile ───────────────────────────────────────────────────────

const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Name must be between 2 and 120 characters.'),

  phoneRule(),

  body('avatarUrl')
    .optional({ nullable: true })
    .isURL().withMessage('Avatar URL must be a valid URL.'),
];

// ─── Change password ──────────────────────────────────────────────────────

const changePasswordRules = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),

  passwordRule('newPassword'),

  body('confirmNewPassword')
    .notEmpty().withMessage('Please confirm your new password.')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match.');
      }
      return true;
    }),
];

module.exports = {
  registerRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
};
