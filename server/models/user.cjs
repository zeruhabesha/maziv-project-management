'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Item, { foreignKey: 'assigned_to', as: 'AssignedItems' });
      // add other associations if needed
    }
  }
  User.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Name cannot be null' },
        notEmpty: { msg: 'Name cannot be empty' }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Invalid email format' },
        notNull: { msg: 'Email cannot be null' },
        notEmpty: { msg: 'Email cannot be empty' }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Password cannot be null' },
        notEmpty: { msg: 'Password cannot be empty' },
        len: { args: [8], msg: 'Password must be at least 8 characters long' }
      }
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user',
      validate: {
        isIn: { args: [['user', 'admin', 'manager']], msg: 'Invalid role' }
      }
    },
    manager_ids: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  });
  return User;
};