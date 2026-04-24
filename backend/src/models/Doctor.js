const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Doctor = sequelize.define(
  'Doctor',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: { msg: 'This user is already registered as a doctor.' },
      field: 'user_id',
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    specialization: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Specialization cannot be empty.' },
      },
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    yearsExperience: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
      field: 'years_experience',
      validate: {
        min: { args: 0, msg: 'Years of experience cannot be negative.' },
      },
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'avatar_url',
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_available',
    },
  },
  {
    tableName: 'doctors',
  }
);

module.exports = Doctor;
