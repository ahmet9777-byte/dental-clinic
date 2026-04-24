/**
 * controllers/appointmentController.js
 *
 * Patient:
 *   POST  /api/appointments              → createAppointment
 *   GET   /api/appointments/my           → getMyAppointments
 *   DELETE /api/appointments/:id         → cancelAppointment  (pending only)
 *
 * Secretary:
 *   GET   /api/appointments              → getAllAppointments
 *   PATCH /api/appointments/:id/confirm  → confirmAppointment
 *   PATCH /api/appointments/:id/reject   → rejectAppointment
 *   PATCH /api/appointments/:id/complete → markCompleted
 *
 * Shared:
 *   GET   /api/appointments/:id          → getAppointmentById
 */

const { Op }          = require('sequelize');
const { Appointment, Doctor, User, DoctorAvailability } = require('../models');
const asyncHandler    = require('../utils/asyncHandler');
const { success, paginated } = require('../utils/response');
const {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  AppError,
} = require('../middleware/errorHandler');
const { sendConfirmationEmail } = require('../services/n8nService');
const { getAvailableSlots }     = require('../services/slotService');

// ─── Shared eager-load config ─────────────────────────────────────────────

const APPOINTMENT_INCLUDE = [
  {
    model      : User,
    as         : 'patient',
    attributes : ['id', 'name', 'email', 'phone'],
  },
  {
    model   : Doctor,
    as      : 'doctor',
    include : [
      {
        model      : User,
        as         : 'user',
        attributes : ['id', 'name', 'email'],
      },
    ],
    attributes: ['id', 'specialization', 'yearsExperience'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/appointments
// Patient books a new appointment
// ─────────────────────────────────────────────────────────────────────────────

const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, condition, appointmentDate, timeSlot, notes } = req.body;

  // Verify doctor exists and is available
  const doctor = await Doctor.findByPk(doctorId);
  if (!doctor)            throw new NotFoundError('Doctor');
  if (!doctor.isAvailable) throw new AppError('This doctor is not currently accepting appointments.', 400, 'DOCTOR_UNAVAILABLE');

  // Verify the requested slot is genuinely free
  const { freeSlots, isWorkingDay } = await getAvailableSlots(doctorId, appointmentDate);

  if (!isWorkingDay) {
    throw new AppError(
      'The doctor does not have availability on the selected date.',
      400,
      'NO_WORKING_DAY'
    );
  }

  if (!freeSlots.includes(timeSlot)) {
    throw new ConflictError(
      'The selected time slot is no longer available. Please choose another slot.'
    );
  }

  // Prevent the same patient booking the same doctor on the same day twice
  const duplicate = await Appointment.findOne({
    where: {
      patientId       : req.user.id,
      doctorId,
      appointmentDate,
      status          : { [Op.in]: ['pending', 'confirmed'] },
    },
  });

  if (duplicate) {
    throw new ConflictError(
      'You already have an active appointment with this doctor on that date.'
    );
  }

  const appointment = await Appointment.create({
    patientId       : req.user.id,
    doctorId,
    condition,
    appointmentDate,
    timeSlot,
    notes           : notes ?? null,
    status          : 'pending',
  });

  // Reload with associations for the response
  const full = await Appointment.findByPk(appointment.id, {
    include: APPOINTMENT_INCLUDE,
  });

  return success(res, full, 'Appointment booked successfully.', 201);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/appointments/my
// Patient views their own appointments
// ─────────────────────────────────────────────────────────────────────────────

const getMyAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const pageNum  = Number(page)  || 1;
  const limitNum = Number(limit) || 10;
  const offset   = (pageNum - 1) * limitNum;

  const where = { patientId: req.user.id };
  if (status) where.status = status;

  const include = APPOINTMENT_INCLUDE.map(inc => ({ ...inc, required: false }));

  const { count, rows } = await Appointment.findAndCountAll({
    where,
    include,
    limit    : limitNum,
    offset,
    order    : [['id', 'DESC']],
    distinct : true,
    subQuery : false,
  });

  return paginated(res, rows, count, pageNum, limitNum);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/appointments/:id
// Patient cancels their own pending appointment
// ─────────────────────────────────────────────────────────────────────────────

const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) throw new NotFoundError('Appointment');

  // Patients can only cancel their own
  if (appointment.patientId !== req.user.id) throw new ForbiddenError();

  if (appointment.status !== 'pending') {
    throw new AppError(
      'Only pending appointments can be cancelled. Please contact the clinic for confirmed appointments.',
      400,
      'CANNOT_CANCEL'
    );
  }

  await appointment.destroy();

  return success(res, null, 'Appointment cancelled successfully.');
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/appointments
// Secretary views all appointments with filtering, search, and pagination
// ─────────────────────────────────────────────────────────────────────────────

const getAllAppointments = asyncHandler(async (req, res) => {
  const {
    status,
    doctorId,
    date,
    search,
    page  = 1,
    limit = 20,
  } = req.query;

  const pageNum  = Number(page)  || 1;
  const limitNum = Number(limit) || 20;
  const offset   = (pageNum - 1) * limitNum;

  const where = {};
  if (status)   where.status          = status;
  if (doctorId) where.doctorId        = Number(doctorId);
  if (date)     where.appointmentDate = date;

  // Build include — add patient name filter only when searching
  const include = APPOINTMENT_INCLUDE.map((inc) => {
    if (inc.as === 'patient' && search) {
      return {
        ...inc,
        where    : { name: { [Op.iLike]: `%${search}%` } },
        required : true,
      };
    }
    return { ...inc, required: false };
  });

  // subQuery: false prevents Sequelize from wrapping the query in a subquery
  // which breaks LIMIT/OFFSET when combined with eager-loaded associations
  const { count, rows } = await Appointment.findAndCountAll({
    where,
    include,
    limit    : limitNum,
    offset,
    order    : [['id', 'DESC']],
    distinct : true,
    subQuery : false,
  });

  return paginated(res, rows, count, pageNum, limitNum);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/appointments/:id/confirm
// Secretary confirms a pending appointment → triggers n8n email
// ─────────────────────────────────────────────────────────────────────────────

const confirmAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByPk(req.params.id, {
    include: APPOINTMENT_INCLUDE,
  });

  if (!appointment) throw new NotFoundError('Appointment');

  if (appointment.status !== 'pending') {
    throw new AppError(
      `Cannot confirm an appointment that is already "${appointment.status}".`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Update status
  await appointment.update({
    status      : 'confirmed',
    confirmedBy : req.user.id,
    confirmedAt : new Date(),
  });

  // Fire-and-forget: trigger n8n email workflow
  // We await the response only to update the emailSent flag — the confirmation
  // succeeds regardless of email delivery outcome.
  const emailSent = await sendConfirmationEmail(appointment);
  if (emailSent) {
    await appointment.update({ emailSent: true });
  }

  await appointment.reload({ include: APPOINTMENT_INCLUDE });

  return success(res, appointment, 'Appointment confirmed successfully.');
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/appointments/:id/reject
// Secretary rejects a pending appointment with an optional reason
// ─────────────────────────────────────────────────────────────────────────────

const rejectAppointment = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const appointment = await Appointment.findByPk(req.params.id, {
    include: APPOINTMENT_INCLUDE,
  });

  if (!appointment) throw new NotFoundError('Appointment');

  if (!['pending', 'confirmed'].includes(appointment.status)) {
    throw new AppError(
      `Cannot reject an appointment that is already "${appointment.status}".`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  await appointment.update({
    status          : 'rejected',
    rejectedReason  : reason ?? null,
    confirmedBy     : req.user.id,
    confirmedAt     : new Date(),
  });

  await appointment.reload({ include: APPOINTMENT_INCLUDE });

  return success(res, appointment, 'Appointment rejected.');
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/appointments/:id/complete
// Secretary or Doctor marks a confirmed appointment as completed
// ─────────────────────────────────────────────────────────────────────────────

const markCompleted = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByPk(req.params.id, {
    include: APPOINTMENT_INCLUDE,
  });

  if (!appointment) throw new NotFoundError('Appointment');

  if (appointment.status !== 'confirmed') {
    throw new AppError(
      'Only confirmed appointments can be marked as completed.',
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  // Doctors can only complete their own appointments
  if (req.user.role === 'doctor') {
    const doctorProfile = appointment.doctor;
    if (!doctorProfile || doctorProfile.userId !== req.user.id) {
      throw new ForbiddenError('You can only complete your own appointments.');
    }
  }

  await appointment.update({ status: 'completed' });
  await appointment.reload({ include: APPOINTMENT_INCLUDE });

  return success(res, appointment, 'Appointment marked as completed.');
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/appointments/:id
// Single appointment detail — patient sees own, secretary/doctor see any
// ─────────────────────────────────────────────────────────────────────────────

const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByPk(req.params.id, {
    include: APPOINTMENT_INCLUDE,
  });

  if (!appointment) throw new NotFoundError('Appointment');

  // Patients can only view their own appointments
  if (req.user.role === 'patient' && appointment.patientId !== req.user.id) {
    throw new ForbiddenError();
  }

  return success(res, appointment);
});

module.exports = {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  getAllAppointments,
  confirmAppointment,
  rejectAppointment,
  markCompleted,
  getAppointmentById,
};
