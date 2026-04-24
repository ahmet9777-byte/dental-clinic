/**
 * routes/doctors.js
 *
 * Public:
 *   GET /api/doctors               → list all available doctors
 *   GET /api/doctors/:id           → single doctor detail
 *   GET /api/doctors/:id/slots     → available time slots (protected)
 *
 * Doctor-only:
 *   GET /api/doctor/schedule       → doctor's own appointment schedule
 *   GET /api/doctor/patients       → doctor's distinct patient list
 */

const router = require('express').Router();

const ctrl = require('../controllers/doctorController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate }            = require('../middleware/validate');
const {
  getSlotsRules,
  paginationRules,
  idParamRules,
} = require('../validators/appointmentValidators');

// ── Public ────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/doctors
 * @desc    List all available doctors. Supports ?specialization, ?search, ?page, ?limit
 * @access  Public
 */
router.get('/', paginationRules, validate(), ctrl.getAllDoctors);

/**
 * @route   GET /api/doctors/:id
 * @desc    Get a single doctor with availability schedule
 * @access  Public
 */
router.get('/:id', idParamRules, validate(), ctrl.getDoctorById);

/**
 * @route   GET /api/doctors/:id/slots
 * @desc    Get available (free) booking slots for a doctor.
 *          Pass ?date=YYYY-MM-DD for a single day, or ?days=N for a range.
 * @access  Private (any authenticated user)
 */
router.get(
  '/:id/slots',
  protect,
  [...idParamRules, ...getSlotsRules],
  validate(),
  ctrl.getDoctorSlots
);

// ── Doctor role — uses /api/doctor (singular) prefix in routes/index.js ───
// These are mounted separately; declared here for co-location with the controller.

module.exports = router;

// ── Doctor-self routes (mounted at /api/doctor in routes/index.js) ────────
const doctorSelfRouter = require('express').Router();

/**
 * @route   GET /api/doctor/schedule
 * @desc    Doctor's own appointment schedule. Supports ?date, ?status filters.
 * @access  Doctor only
 */
doctorSelfRouter.get(
  '/schedule',
  protect,
  restrictTo('doctor'),
  ctrl.getDoctorSchedule
);

/**
 * @route   GET /api/doctor/patients
 * @desc    Distinct patients who have (or had) appointments with this doctor
 * @access  Doctor only
 */
doctorSelfRouter.get(
  '/patients',
  protect,
  restrictTo('doctor'),
  ctrl.getDoctorPatients
);

module.exports.doctorSelfRouter = doctorSelfRouter;
