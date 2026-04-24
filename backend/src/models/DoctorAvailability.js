const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DoctorAvailability = sequelize.define(
  'DoctorAvailability',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id',
      references: { model: 'doctors', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    dayOfWeek: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'day_of_week',
      validate: {
        min: { args: 0, msg: 'Day of week must be 0 (Sunday) to 6 (Saturday).' },
        max: { args: 6, msg: 'Day of week must be 0 (Sunday) to 6 (Saturday).' },
      },
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time',
      validate: {
        notEmpty: { msg: 'Start time is required.' },
      },
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time',
      validate: {
        notEmpty: { msg: 'End time is required.' },
        isAfterStart(value) {
          if (value <= this.startTime) {
            throw new Error('End time must be after start time.');
          }
        },
      },
    },
    slotDuration: {
      type: DataTypes.SMALLINT,
      defaultValue: 30,
      field: 'slot_duration',
      validate: {
        min: { args: 1, msg: 'Slot duration must be at least 1 minute.' },
      },
    },
  },
  {
    tableName: 'doctor_availability',
    updatedAt: false,  // availability rows don't need updatedAt
    indexes: [
      {
        unique: true,
        fields: ['doctor_id', 'day_of_week'],
        name: 'da_doctor_day_unique',
      },
    ],
  }
);

module.exports = DoctorAvailability;
