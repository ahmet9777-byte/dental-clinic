/**
 * controllers/staffAuthController.js
 *
 * Handles staff (secretary / doctor) login.
 * Patients cannot use this endpoint — it verifies role explicitly.
 *
 *   POST /api/auth/staff/login
 */

const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');

const { User, Doctor, DoctorAvailability } = require('../models');
const env          = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { success }  = require('../utils/response');
const { UnauthorizedError } = require('../middleware/errorHandler');

const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/staff/login
// ─────────────────────────────────────────────────────────────────────────────

const staffLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.unscoped().findOne({ where: { email } });

  const invalid = 'Incorrect email or password.';
  if (!user) throw new UnauthorizedError(invalid);
  if (!user.isActive) throw new UnauthorizedError('This account has been deactivated.');

  // Reject patients attempting to use the staff portal
  if (user.role === 'patient') {
    throw new UnauthorizedError(
      'This portal is for clinic staff only. Please use the patient login.'
    );
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new UnauthorizedError(invalid);

  // For doctors, attach their full profile + availability
  let doctorProfile = null;
  if (user.role === 'doctor') {
    doctorProfile = await Doctor.findOne({
      where   : { userId: user.id },
      include : [{
        model : DoctorAvailability,
        as    : 'availability',
      }],
    });
  }

  const token = signToken(user.id, user.role);

  const responseUser = {
    id        : user.id,
    name      : user.name,
    email     : user.email,
    role      : user.role,
    phone     : user.phone     ?? null,
    avatarUrl : user.avatarUrl ?? null,
  };

  if (doctorProfile) {
    responseUser.doctorProfile = {
      id              : doctorProfile.id,
      specialization  : doctorProfile.specialization,
      bio             : doctorProfile.bio,
      yearsExperience : doctorProfile.yearsExperience,
      isAvailable     : doctorProfile.isAvailable,
      availability    : doctorProfile.availability,
    };
  }

  return success(res, { token, user: responseUser }, 'Staff login successful.');
});

module.exports = { staffLogin };
