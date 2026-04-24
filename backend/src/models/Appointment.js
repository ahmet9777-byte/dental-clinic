const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DENTAL_CONDITIONS = [
  'crown',
  'cleaning',
  'extraction',
  'braces',
  'rootcanal',
  'other',
];

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'rejected', 'completed'];

const Appointment = sequelize.define(
  'Appointment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_id',
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id',
      references: { model: 'doctors', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    condition: {
      type: DataTypes.ENUM(...DENTAL_CONDITIONS),
      allowNull: false,
      validate: {
        isIn: {
          args: [DENTAL_CONDITIONS],
          msg: `Condition must be one of: ${DENTAL_CONDITIONS.join(', ')}.`,
        },
      },
    },
    appointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'appointment_date',
      validate: {
        isDate: { msg: 'Please provide a valid appointment date.' },
        isNotPast(value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (new Date(value) < today) {
            throw new Error('Appointment date cannot be in the past.');
          }
        },
      },
    },
    timeSlot: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'time_slot',
      validate: {
        notEmpty: { msg: 'Time slot is required.' },
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...APPOINTMENT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [APPOINTMENT_STATUSES],
          msg: `Status must be one of: ${APPOINTMENT_STATUSES.join(', ')}.`,
        },
      },
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_sent',
    },
    rejectedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejected_reason',
    },
    confirmedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'confirmed_by',
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'confirmed_at',
    },
  },
  {
    tableName: 'appointments',
    indexes: [
      { fields: ['patient_id'], name: 'idx_appt_patient_id' },
      { fields: ['doctor_id'],  name: 'idx_appt_doctor_id' },
      { fields: ['status'],     name: 'idx_appt_status' },
      { fields: ['appointment_date'], name: 'idx_appt_date' },
      {
        unique: true,
        fields: ['doctor_id', 'appointment_date', 'time_slot'],
        name: 'appt_no_double_book',
      },
    ],
  }
);

module.exports = Appointment;
module.exports.DENTAL_CONDITIONS = DENTAL_CONDITIONS;
module.exports.APPOINTMENT_STATUSES = APPOINTMENT_STATUSES;
