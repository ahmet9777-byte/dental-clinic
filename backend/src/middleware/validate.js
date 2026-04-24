/**
 * middleware/validate.js
 *
 * Thin wrapper around express-validator.
 * Usage: place validate() as the last entry in a route's middleware array.
 *
 * Example:
 *   router.post('/register',
 *     body('email').isEmail(),
 *     body('password').isLength({ min: 8 }),
 *     validate(),
 *     authController.register
 *   );
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

/**
 * Collects express-validator errors and forwards a ValidationError
 * to the global error handler if any field fails.
 */
const validate = () => (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field   : e.path || e.param,
    message : e.msg,
  }));

  next(new ValidationError('Request validation failed.', errors));
};

module.exports = { validate };
