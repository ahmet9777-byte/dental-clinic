/**
 * validators/appointmentValidators.js
 *
 * express-validator chains for the appointments and doctors endpoints.
 */

const { body, query, param } = require('express-validator');
const { DENTAL_CONDITIONS }  = require('../models/Appointment');

// ─── Date helpers ─────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidFutureDate = (value) => {
  if (!ISO_DATE_RE.test(value)) throw new Error('Date must be in YYYY-MM-DD format.');
  const d     = new Date(value + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (isNaN(d.getTime()))  throw new Error('Invalid date.');
  if (d < today)           throw new Error('Appointment date cannot be in the past.');
  return true;
};

// ─── Create appointment ───────────────────────────────────────────────────

const createAppointmentRules = [
  body('doctorId')
    .notEmpty().withMessage('Doctor ID is required.')
    .isInt({ min: 1 }).withMessage('Doctor ID must be a positive integer.')
    .toInt(),

  body('condition')
    .notEmpty().withMessage('Dental condition is required.')
    .isIn(DENTAL_CONDITIONS)
    .withMessage(`Condition must be one of: ${DENTAL_CONDITIONS.join(', ')}.`),

  body('appointmentDate')
    .notEmpty().withMessage('Appointment date is required.')
    .custom(isValidFutureDate),

  body('timeSlot')
    .trim()
    .notEmpty().withMessage('Time slot is required.')
    .matches(/^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/)
    .withMessage('Time slot must be in "h:mm AM/PM" format (e.g. "10:00 AM").'),

  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters.'),
];

// ─── Confirm / reject ─────────────────────────────────────────────────────

const rejectAppointmentRules = [
  body('reason')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage('Rejection reason cannot exceed 300 characters.'),
];

// ─── Get slots query params ───────────────────────────────────────────────

const getSlotsRules = [
  query('date')
    .optional()
    .custom((value) => {
      if (!ISO_DATE_RE.test(value)) throw new Error('Date must be in YYYY-MM-DD format.');
      return true;
    }),

  query('days')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('days must be between 1 and 60.')
    .toInt(),
];

// ─── List query params (shared for /appointments and /doctors) ────────────

const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer.')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000.')
    .toInt(),
];

const appointmentFilterRules = [
  ...paginationRules,

  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'rejected', 'completed'])
    .withMessage('Invalid status filter.'),

  query('doctorId')
    .optional()
    .isInt({ min: 1 }).withMessage('doctorId must be a positive integer.')
    .toInt(),

  query('date')
    .optional()
    .custom((value) => {
      if (!ISO_DATE_RE.test(value)) throw new Error('Date must be in YYYY-MM-DD format.');
      return true;
    }),
];

// ─── ID param ─────────────────────────────────────────────────────────────

const idParamRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer.')
    .toInt(),
];

module.exports = {
  createAppointmentRules,
  rejectAppointmentRules,
  getSlotsRules,
  paginationRules,
  appointmentFilterRules,
  idParamRules,
};
