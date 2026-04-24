/**
 * models/index.js
 *
 * Central registry for all Sequelize models.
 * All associations are defined here — not inside the model files —
 * so the dependency graph stays clear and circular-require free.
 */

const { sequelize } = require('../config/db');

const User                = require('./User');
const Doctor              = require('./Doctor');
const DoctorAvailability  = require('./DoctorAvailability');
const Appointment         = require('./Appointment');

// ─────────────────────────────────────────────────────────────
// Associations
// ─────────────────────────────────────────────────────────────

// User ↔ Doctor  (1-to-1)
User.hasOne(Doctor, {
  foreignKey: 'userId',
  as: 'doctorProfile',
  onDelete: 'CASCADE',
});
Doctor.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Doctor → DoctorAvailability  (1-to-many)
Doctor.hasMany(DoctorAvailability, {
  foreignKey: 'doctorId',
  as: 'availability',
  onDelete: 'CASCADE',
});
DoctorAvailability.belongsTo(Doctor, {
  foreignKey: 'doctorId',
  as: 'doctor',
});

// Patient (User) → Appointments  (1-to-many)
User.hasMany(Appointment, {
  foreignKey: 'patientId',
  as: 'appointments',
  onDelete: 'CASCADE',
});
Appointment.belongsTo(User, {
  foreignKey: 'patientId',
  as: 'patient',
});

// Doctor → Appointments  (1-to-many)
Doctor.hasMany(Appointment, {
  foreignKey: 'doctorId',
  as: 'appointments',
  onDelete: 'RESTRICT',
});
Appointment.belongsTo(Doctor, {
  foreignKey: 'doctorId',
  as: 'doctor',
});

// Secretary (User) → Confirmed Appointments  (1-to-many, nullable)
User.hasMany(Appointment, {
  foreignKey: 'confirmedBy',
  as: 'confirmedAppointments',
});
Appointment.belongsTo(User, {
  foreignKey: 'confirmedBy',
  as: 'confirmedByUser',
});

// ─────────────────────────────────────────────────────────────
// Sync helper (development only)
// In production, use schema.sql or a proper migration tool.
// ─────────────────────────────────────────────────────────────
const syncDB = async (options = {}) => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  syncDB called in production. Use migrations instead.');
    return;
  }
  await sequelize.sync(options);
  console.log('✅  Database synced.');
};

module.exports = {
  sequelize,
  User,
  Doctor,
  DoctorAvailability,
  Appointment,
  syncDB,
};
