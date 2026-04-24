/**
 * controllers/doctorController.js
 *
 * GET  /api/doctors               → getAllDoctors    (public)
 * GET  /api/doctors/:id           → getDoctorById    (public)
 * GET  /api/doctors/:id/slots     → getDoctorSlots   (protected)
 * GET  /api/doctor/schedule       → getDoctorSchedule (doctor only)
 * GET  /api/doctor/patients       → getDoctorPatients (doctor only)
 */

const { Op }           = require('sequelize');
const { Doctor, User, DoctorAvailability, Appointment } = require('../models');
const asyncHandler     = require('../utils/asyncHandler');
const { success, paginated } = require('../utils/response');
const { NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const { getAvailableSlots, getAvailableSlotsRange } = require('../services/slotService');

// ─── Shared include: doctor with user + availability ──────────────────────

const DOCTOR_INCLUDE = [
  {
    model      : User,
    as         : 'user',
    attributes : ['id', 'name', 'email', 'phone', 'avatarUrl'],
  },
  {
    model : DoctorAvailability,
    as    : 'availability',
    // Order by day so Mon→Fri comes out sorted
    order : [['dayOfWeek', 'ASC']],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctors
// ─────────────────────────────────────────────────────────────────────────────

const getAllDoctors = asyncHandler(async (req, res) => {
  const { specialization, search, page = 1, limit = 20 } = req.query;

  const where  = { isAvailable: true };
  const offset = (Number(page) - 1) * Number(limit);

  if (specialization) {
    where.specialization = { [Op.iLike]: `%${specialization}%` };
  }

  // Search by doctor name via the User join
  const userWhere = search
    ? { name: { [Op.iLike]: `%${search}%` } }
    : undefined;

  const { count, rows } = await Doctor.findAndCountAll({
    where,
    include: DOCTOR_INCLUDE.map((inc) => {
      if (inc.as === 'user' && userWhere) {
        return { ...inc, where: userWhere, required: true };
      }
      return inc;
    }),
    limit  : Number(limit),
    offset,
    order  : [['id', 'ASC']],
    distinct: true,
  });

  return paginated(res, rows, count, page, limit);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctors/:id
// ─────────────────────────────────────────────────────────────────────────────

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id, {
    include: DOCTOR_INCLUDE,
  });

  if (!doctor) throw new NotFoundError('Doctor');

  return success(res, doctor);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctors/:id/slots?date=YYYY-MM-DD&days=14
// ─────────────────────────────────────────────────────────────────────────────

const getDoctorSlots = asyncHandler(async (req, res) => {
  const doctorId = Number(req.params.id);
  const { date, days } = req.query;

  // Verify doctor exists
  const doctor = await Doctor.findByPk(doctorId);
  if (!doctor) throw new NotFoundError('Doctor');
  if (!doctor.isAvailable) {
    return success(res, { isAvailable: false, freeSlots: [] }, 'Doctor is not currently available.');
  }

  if (date) {
    // Single-day query
    const slots = await getAvailableSlots(doctorId, date);
    return success(res, slots);
  }

  // Range query (default: next 14 days from today)
  const fromDate = new Date().toISOString().split('T')[0];
  const rangeSlots = await getAvailableSlotsRange(doctorId, fromDate, Number(days) || 14);
  return success(res, rangeSlots);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctor/schedule  (doctor role only)
// ─────────────────────────────────────────────────────────────────────────────

const getDoctorSchedule = asyncHandler(async (req, res) => {
  // Resolve the Doctor row that belongs to this logged-in user
  const doctorProfile = await Doctor.findOne({ where: { userId: req.user.id } });
  if (!doctorProfile) throw new NotFoundError('Doctor profile');

  const { date, status } = req.query;

  const where = { doctorId: doctorProfile.id };

  if (date) {
    where.appointmentDate = date;
  } else {
    // Default: today and forward
    where.appointmentDate = { [Op.gte]: new Date().toISOString().split('T')[0] };
  }

  if (status) {
    where.status = status;
  } else {
    where.status = { [Op.in]: ['confirmed', 'pending', 'completed'] };
  }

  const appointments = await Appointment.findAll({
    where,
    include: [
      {
        model      : User,
        as         : 'patient',
        attributes : ['id', 'name', 'email', 'phone'],
      },
    ],
    order: [
      ['appointmentDate', 'ASC'],
      ['timeSlot', 'ASC'],
    ],
  });

  return success(res, appointments);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctor/patients  (doctor role only)
// Returns the distinct list of patients who have appointments with this doctor
// ─────────────────────────────────────────────────────────────────────────────

const getDoctorPatients = asyncHandler(async (req, res) => {
  const doctorProfile = await Doctor.findOne({ where: { userId: req.user.id } });
  if (!doctorProfile) throw new NotFoundError('Doctor profile');

  // Get unique patients via a subquery on appointments
  const appointments = await Appointment.findAll({
    where: { doctorId: doctorProfile.id },
    include: [
      {
        model      : User,
        as         : 'patient',
        attributes : ['id', 'name', 'email', 'phone'],
      },
    ],
    attributes : ['patientId', 'condition', 'status', 'appointmentDate'],
    order      : [['appointmentDate', 'DESC']],
  });

  // Deduplicate patients, keeping their most recent appointment
  const seen    = new Set();
  const patients = [];
  for (const appt of appointments) {
    if (!seen.has(appt.patientId)) {
      seen.add(appt.patientId);
      patients.push({
        patient         : appt.patient,
        lastCondition   : appt.condition,
        lastStatus      : appt.status,
        lastVisitDate   : appt.appointmentDate,
      });
    }
  }

  return success(res, patients);
});

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorSlots,
  getDoctorSchedule,
  getDoctorPatients,
};
