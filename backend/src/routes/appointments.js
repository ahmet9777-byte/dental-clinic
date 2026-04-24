/**
 * routes/appointments.js
 *
 * Patient:
 *   POST   /api/appointments              → book appointment
 *   GET    /api/appointments/my           → patient's own appointments
 *   DELETE /api/appointments/:id          → cancel pending appointment
 *
 * Secretary:
 *   GET    /api/appointments              → all appointments (filtered)
 *   PATCH  /api/appointments/:id/confirm  → confirm + trigger email
 *   PATCH  /api/appointments/:id/reject   → reject with optional reason
 *   PATCH  /api/appointments/:id/complete → mark as completed
 *
 * Shared (authenticated):
 *   GET    /api/appointments/:id          → single appointment detail
 */

const router = require('express').Router();

const ctrl = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate }            = require('../middleware/validate');
const {
  createAppointmentRules,
  rejectAppointmentRules,
  appointmentFilterRules,
  idParamRules,
} = require('../validators/appointmentValidators');

// ── Patient routes ────────────────────────────────────────────────────────

/**
 * @route   POST /api/appointments
 * @access  Patient
 * @body    { doctorId, condition, appointmentDate, timeSlot, notes? }
 */
router.post(
  '/',
  protect,
  restrictTo('patient'),
  createAppointmentRules,
  validate(),
  ctrl.createAppointment
);

/**
 * @route   GET /api/appointments/my
 * @desc    Patient's own appointments. Supports ?status, ?page, ?limit
 * @access  Patient
 *
 * IMPORTANT: /my must be declared BEFORE /:id to avoid Express
 * matching "my" as an ID parameter.
 */
router.get(
  '/my',
  protect,
  restrictTo('patient'),
  ctrl.getMyAppointments
);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Cancel a pending appointment (patient only, own appointments)
 * @access  Patient
 */
router.delete(
  '/:id',
  protect,
  restrictTo('patient'),
  idParamRules,
  validate(),
  ctrl.cancelAppointment
);

// ── Secretary routes ──────────────────────────────────────────────────────

/**
 * @route   GET /api/appointments
 * @desc    All appointments with filtering. Supports ?status, ?doctorId, ?date, ?search, ?page, ?limit
 * @access  Secretary
 */
router.get(
  '/',
  protect,
  restrictTo('secretary'),
  appointmentFilterRules,
  validate(),
  ctrl.getAllAppointments
);

/**
 * @route   PATCH /api/appointments/:id/confirm
 * @access  Secretary
 */
router.patch(
  '/:id/confirm',
  protect,
  restrictTo('secretary'),
  idParamRules,
  validate(),
  ctrl.confirmAppointment
);

/**
 * @route   PATCH /api/appointments/:id/reject
 * @access  Secretary
 * @body    { reason? }
 */
router.patch(
  '/:id/reject',
  protect,
  restrictTo('secretary'),
  [...idParamRules, ...rejectAppointmentRules],
  validate(),
  ctrl.rejectAppointment
);

/**
 * @route   PATCH /api/appointments/:id/complete
 * @access  Secretary or Doctor
 */
router.patch(
  '/:id/complete',
  protect,
  restrictTo('secretary', 'doctor'),
  idParamRules,
  validate(),
  ctrl.markCompleted
);

// ── Shared (any authenticated role) ──────────────────────────────────────

/**
 * @route   GET /api/appointments/:id
 * @desc    Single appointment detail. Patients can only access their own.
 * @access  Any authenticated user
 */
router.get(
  '/:id',
  protect,
  idParamRules,
  validate(),
  ctrl.getAppointmentById
);

module.exports = router;
