const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        len: {
          args: [2, 120],
          msg: 'Name must be between 2 and 120 characters.',
        },
        notEmpty: { msg: 'Name cannot be empty.' },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: { msg: 'This email address is already registered.' },
      validate: {
        isEmail: { msg: 'Please provide a valid email address.' },
        notEmpty: { msg: 'Email cannot be empty.' },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password cannot be empty.' },
      },
    },
    role: {
      type: DataTypes.ENUM('patient', 'secretary', 'doctor'),
      allowNull: false,
      defaultValue: 'patient',
      validate: {
        isIn: {
          args: [['patient', 'secretary', 'doctor']],
          msg: 'Role must be patient, secretary, or doctor.',
        },
      },
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
      validate: {
        is: {
          args: /^[+\d\s\-().]{7,20}$/,
          msg: 'Please provide a valid phone number.',
        },
      },
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'avatar_url',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    tableName: 'users',
    // Strip password from all JSON outputs by default
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      // Use this scope ONLY when the password is required (login flow)
      withPassword: {
        attributes: { include: ['password'] },
      },
    },
  }
);

module.exports = User;
